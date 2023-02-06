import {
    ObjectId
} from "mongodb";
import moduleConfig from "../module.js";
import utils from "./utils";

export default () => ({
    async handler(req, rep) {
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (!authData) {
                return rep.error({}, 403);
            }
            // Just allow one item to be restored at once
            if (!req.validateDataDelete() || req.body.ids.length > 1) {
                return rep.error({
                    message: "validation_error"
                });
            }
            const query = {
                _id: new ObjectId(req.body.ids[0]),
            };
            const dbItem = await this.mongo.db.collection(this.systemConfig.collections.history).findOne(query);
            if (!dbItem) {
                return rep.error({
                    message: "notFound"
                }, 404);
            }
            const queryRef = {
                $and: [{
                    _id: new ObjectId(dbItem.recordId),
                }],
            };
            queryRef.$and.push(utils.filter({}, authData) || {});
            const refItem = await this.mongo.db.collection(moduleConfig.collections.main).findOne(queryRef);
            if (!refItem) {
                return rep.error({
                    message: "notFound"
                }, 404);
            }
            const deleteResult = await this.mongo.db.collection(this.systemConfig.collections.history).deleteMany(query);
            return rep.code(200).send({
                count: deleteResult.deletedCount,
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
