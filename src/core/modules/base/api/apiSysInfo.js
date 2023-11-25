import {
    ObjectId
} from "mongodb";
import axios from "axios";
import systemInformation from "systeminformation";
import packageJson from "#root/package.json";
import buildJson from "#build/build.json";
import moduleConfig from "../module.js";

export default () => ({
    async handler(req, rep) {
        const authData = await req.auth.getData(req.auth.methods.COOKIE);
        if (!authData || !authData.groupData || !authData.groupData.find(i => i.id === "admin" && i.value === true)) {
            return rep.error({
                message: "Access Denied",
            }, 403);
        }
        try {
            let masterPackageJson = {};
            try {
                const {
                    data,
                } = await axios({
                    method: "get",
                    url: this.systemConfig.heretic.packageJson,
                    data: {},
                    headers: {},
                });
                masterPackageJson = data;
            } catch {
                //
            }
            const onlineUsers = {};
            let connections = 0;
            if (this.redis && this.systemConfig.webSockets && this.systemConfig.webSockets.enabled) {
                try {
                    const online = {};
                    const query = {
                        $or: [],
                    };
                    const usersRecords = await this.redis.keys(`${this.systemConfig.id}_user_*`);
                    connections = usersRecords.length;
                    for (const item of usersRecords.slice(0, 100)) {
                        const [, , userId] = item.split(/_/);
                        let lastSeen = await this.redis.get(item);
                        lastSeen = lastSeen ? parseInt(lastSeen, 10) : null;
                        query.$or.push({
                            _id: new ObjectId(userId),
                        });
                        if (lastSeen && (!online[userId] || online[userId] < lastSeen)) {
                            online[userId] = lastSeen;
                        }
                    }
                    if (query.$or.length) {
                        const usersDb = await this.mongo.db.collection(this.systemConfig.collections.users).find(query, {
                            projection: {
                                _id: 1,
                                username: 1,
                            }
                        }).toArray();
                        for (const user of usersDb) {
                            onlineUsers[user.username] = online[user._id.toString()];
                        }
                    }
                } catch {
                    // Ignore
                }
            }
            let existingJob = null;
            if (this.systemConfig.collections.jobs) {
                existingJob = await this.mongo.db.collection(this.systemConfig.collections.jobs).findOne({
                    module: moduleConfig.id,
                });
            }
            return rep.success({
                hereticVersion: packageJson.version,
                onlineUsers,
                existingJob,
                connections,
                productionMode: buildJson.production,
                masterPackageJson,
                systemConfig: {
                    server: this.systemConfig.server,
                    auth: this.systemConfig.server,
                    oauth2: this.systemConfig.oauth2.filter(i => i.enabled).map(i => i.name),
                    mongo: this.systemConfig.mongo.enabled,
                    redis: this.systemConfig.redis.enabled,
                    email: this.systemConfig.email.enabled,
                    webSockets: this.systemConfig.webSockets.enabled,
                    rateLimit: this.systemConfig.rateLimit.enabled,
                    logLevel: this.systemConfig.log.level,
                },
                siTime: systemInformation.time(),
                siSystem: await systemInformation.system(),
                siCPU: await systemInformation.cpu(),
                siMem: await systemInformation.mem(),
                siOSInfo: await systemInformation.osInfo(),
                siCurrentLoad: await systemInformation.currentLoad(),
                siFsSize: await systemInformation.fsSize(),
                siNetworkInterfaces: await systemInformation.networkInterfaces(),
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
