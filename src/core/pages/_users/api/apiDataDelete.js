import {
    ObjectId
} from "mongodb";
import moduleConfig from "../admin.js";

export default () => ({
    async handler(req, rep) {
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (!authData) {
                return rep.error({}, 403);
            }
            if (!req.validateDataDelete()) {
                return rep.error({
                    message: "validation_error"
                }, 401);
            }
            const query = {
                $or: []
            };
            for (const id of req.body.ids) {
                query.$or.push({
                    _id: new ObjectId(id)
                });
            }
            if (moduleConfig.recycleBin && moduleConfig.recycleBin.enabled) {
                const updateResult = await this.mongo.db.collection(moduleConfig.collections.main).updateMany(query, {
                    $set: {
                        deleted: {
                            date: new Date(),
                            userId: authData._id.toString(),
                        },
                    }
                });
                return rep.code(200).send({
                    count: updateResult.modifiedCount,
                });
            }
            const deleteResult = await this.mongo.db.collection(moduleConfig.collections.main).deleteMany(query);
            return rep.code(200).send({
                count: deleteResult.deletedCount,
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
