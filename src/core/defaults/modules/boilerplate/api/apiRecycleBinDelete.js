import {
    ObjectId
} from "mongodb";
import moduleConfig from "../module.js";
// import utils from "./utils";

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
            // if (!utils.isSaveAllowed(authData, dbItem)) {
            //     return rep.error({
            //         message: "accessDenied",
            //     }, 400);
            // }
            if (!this.systemConfig.demo) {
                const deleteResult = await this.mongo.db.collection(moduleConfig.collections.main).deleteOne(query);
                return rep.code(200).send({
                    count: deleteResult.deletedCount,
                });
            }
            return rep.code(200).send({
                count: 0,
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
