import {
    ObjectId
} from "mongodb";
import moduleConfig from "../module.js";

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
            const query = {
                _id: new ObjectId(req.body.id),
                module: moduleConfig.id,
            };
            const item = await this.mongo.db.collection(this.systemConfig.collections.history).findOne(query);
            if (!item) {
                return rep.error({
                    message: "not_found",
                }, 404);
            }
            await this.mongo.db.collection(moduleConfig.collections.main).updateOne({
                _id: new ObjectId(item.recordId),
            }, {
                $set: item.data,
            }, {
                upsert: false,
            });
            return rep.code(200).send({});
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
