import { ObjectId } from "mongodb";
import moduleConfig from "../module.js";

export default () => ({
    async handler(req, rep) {
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (
                !authData ||
                !authData.groupData ||
                !authData.groupData.find(
                    (i) => i.id === "admin" && i.value === true,
                )
            ) {
                return rep.error(
                    {
                        message: "Access Denied",
                    },
                    403,
                );
            }
            if (!req.validateDataDelete()) {
                return rep.error({
                    message: "validation_error",
                });
            }
            const query = {
                $or: [],
            };
            for (const id of req.body.ids) {
                query.$or.push({
                    _id: new ObjectId(id),
                });
            }
            if (
                moduleConfig.recycleBin &&
                moduleConfig.recycleBin.enabled &&
                !this.systemConfig.demo
            ) {
                const updateResult = await this.mongo.db
                    .collection(moduleConfig.collections.content)
                    .updateMany(query, {
                        $set: {
                            deleted: {
                                date: new Date(),
                                userId: authData._id.toString(),
                            },
                        },
                    });
                return rep.code(200).send({
                    count: updateResult.modifiedCount,
                });
            }

            const deleteResult = this.systemConfig.demo
                ? {
                      deletedCount: 0,
                  }
                : await this.mongo.db
                      .collection(moduleConfig.collections.content)
                      .deleteMany(query);
            return rep.code(200).send({
                count: deleteResult.deletedCount,
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    },
});
