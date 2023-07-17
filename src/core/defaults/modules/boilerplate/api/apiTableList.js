import FormData from "../data/form";
import moduleConfig from "../module.js";
import utils from "./utils";

export default () => ({
    async handler(req, rep) {
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (!authData) {
                return rep.error({}, 403);
            }
            const formData = new FormData();
            const options = req.validateTableList(formData);
            if (!options) {
                return rep.error({
                    message: "validation_error",
                });
            }
            const query = req.generateQuery(formData) || {};
            query.$and.push(utils.filter({}, authData) || {});
            const restrictedFields = formData.getRestrictedFields ? formData.getRestrictedFields() : [];
            const restrictedAreas = formData.getRestrictedAreas ? formData.getRestrictedAreas() : [];
            const {
                access,
            } = utils.getAccessData(restrictedFields, restrictedAreas, formData.getFieldsArea ? formData.getFieldsArea() : {}, authData, options);
            const grandTotal = await this.mongo.db.collection(moduleConfig.collections.main).countDocuments({
                deleted: {
                    $exists: false,
                },
            });
            const total = await this.mongo.db.collection(moduleConfig.collections.main).countDocuments(query);
            const items = await this.mongo.db.collection(moduleConfig.collections.main).find(query, options).toArray();
            return rep.code(200).send({
                items: req.processDataList(items, formData.getFieldsFlat()),
                total,
                grandTotal,
                access,
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
