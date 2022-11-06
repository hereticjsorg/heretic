import {
    ObjectId,
} from "mongodb";
import moduleConfig from "../admin.js";

export default () => ({
    async handler(req, rep) {
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (!authData) {
                return rep.error({}, 403);
            }
            if (!req.validateDataLoad()) {
                return rep.error({
                    message: "validation_error",
                });
            }
            if (this.redis) {
                const userId = await this.redis.get(`${this.siteConfig.id}_lock_${moduleConfig.id}_${req.body.id}`);
                if (userId) {
                    const userDb = await this.mongo.db.collection(this.siteConfig.collections.users).findOne({
                        _id: new ObjectId(userId),
                    }, {
                        projection: {
                            _id: 1,
                            username: 1,
                        }
                    });
                    return rep.code(200).send({
                        lock: {
                            username: userDb.username,
                        },
                    });
                }
            }
            return rep.code(200).send({});
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
