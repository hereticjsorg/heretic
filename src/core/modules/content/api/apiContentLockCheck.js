import { ObjectId } from "mongodb";

const lockId = "content";

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
                const userId = await this.redis.get(
                    `${this.systemConfig.id}_lock_${lockId}_${req.body.id}`,
                );
                if (userId) {
                    const userDb = await this.mongo.db
                        .collection(this.systemConfig.collections.users)
                        .findOne(
                            {
                                _id: new ObjectId(userId),
                            },
                            {
                                projection: {
                                    _id: 1,
                                    username: 1,
                                },
                            },
                        );
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
    },
});
