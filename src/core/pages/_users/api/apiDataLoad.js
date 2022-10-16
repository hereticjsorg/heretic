import {
    ObjectId
} from "mongodb";
import FormData from "../data/form";
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
                }, 401);
            }
            const formData = new FormData();
            const item = await this.mongo.db.collection(moduleConfig.collections.main).findOne({
                _id: new ObjectId(req.body.id),
            });
            const data = req.processFormData({
                _default: item,
            }, formData.getFieldsFlat(), [{
                id: "_default",
            }]);
            return rep.code(200).send(data);
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
