import {
    ObjectId
} from "mongodb";

const os = require("os");
const packageJson = require("#root/package.json");
const buildConfig = require("#build/build.json");

export default () => ({
    async handler(req, rep) {
        const authData = await req.auth.getData(req.auth.methods.COOKIE);
        if (!authData || !authData.groupData || !authData.groupData.find(i => i.id === "admin" && i.value === true)) {
            return rep.error({
                message: "Access Denied",
            }, 403);
        }
        try {
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
            const osTotalMem = os.totalmem();
            const sizes = ["", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
            return rep.success({
                hereticVersion: packageJson.version,
                osType: os.type(),
                osRelease: os.release(),
                osPlatform: os.platform(),
                osFreeMem: os.freemem(),
                osTotalMem: `${parseFloat((osTotalMem / 1024 ** Math.floor(Math.log(osTotalMem) / Math.log(1024))).toFixed(0))} ${sizes[Math.floor(Math.log(osTotalMem) / Math.log(1024))]}`,
                onlineUsers,
                connections,
                pagesCore: buildConfig.directories.pagesCore,
                pages: buildConfig.directories.pages,
                modules: buildConfig.directories.modules,
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
