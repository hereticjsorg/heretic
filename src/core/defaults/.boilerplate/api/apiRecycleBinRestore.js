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
                deleted: {
                    $exists: true,
                },
            };
            const dbItem = await this.mongo.db.collection(moduleConfig.collections.main).findOne(query);
            if (!dbItem) {
                return rep.error({
                    message: "notFound"
                }, 404);
            }
            if (!utils.isSaveAllowed(authData, dbItem)) {
                return rep.error({
                    message: "accessDenied",
                }, 400);
            }
            const updateResult = await this.mongo.db.collection(moduleConfig.collections.main).updateOne(query, {
                $unset: {
                    deleted: null,
                }
            });
            return rep.code(200).send({
                count: updateResult.modifiedCount,
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
