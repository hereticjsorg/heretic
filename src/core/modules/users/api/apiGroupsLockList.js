import {
    ObjectId,
} from "mongodb";
// import moduleConfig from "../module.js";

const lockId = "groups";

export default () => ({
    async handler(req, rep) {
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (!authData) {
                return rep.error({}, 403);
            }
            if (this.redis) {
                const query = {
                    $or: [],
                };
                const lockData = {};
                const lockRecords = await this.redis.keys(`${this.systemConfig.id}_lock_${lockId}_*`);
                const lockRecordRex = new RegExp(`^${this.systemConfig.id}_lock_${lockId}_`, "i");
                for (const record of (lockRecords || [])) {
                    const userId = await this.redis.get(record);
                    if (userId) {
                        const recordId = record.replace(lockRecordRex, "");
                        query.$or.push({
                            _id: new ObjectId(userId),
                        });
                        lockData[recordId] = userId;
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
                        for (const k of Object.keys(lockData)) {
                            if (lockData[k] === user._id.toString()) {
                                lockData[k] = user.username;
                            }
                        }
                    }
                }
                return rep.code(200).send({
                    lock: Object.keys(lockData).length ? lockData : undefined,
                });
            }
            return rep.code(200).send({});
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
