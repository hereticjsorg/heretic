import FormValidator from "../../../lib/formValidatorServer";
import FormData from "../data/form";
import moduleConfig from "../admin.js";

export default () => ({
    async handler(req, rep) {
        const formData = new FormData();
        const formValidator = new FormValidator(formData.getValidationSchema(), formData.getFieldsFlat(), this);
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (!authData) {
                return rep.error({}, 403);
            }
            if (!req.validateDataBulk()) {
                return rep.error({
                    message: "validation_error"
                });
            }
            const query = req.bulkUpdateQuery(formData) || {};
            const fields = formData.getFieldsFlat();
            const tabs = formData.getTabs ? formData.getTabs().map(i => i) : ["_default"];
            const data = {};
            for (const item of req.body.bulkItems) {
                for (const tab of item.tabs) {
                    const field = fields[item.id];
                    if (field && tabs.indexOf(tab) > -1) {
                        if (tab === "_default") {
                            data[item.id] = formValidator.processValue(fields[item.id].type, item.value);
                        } else {
                            data[`${tab}.${item.id}`] = formValidator.processValue(fields[item.id].type, item.value);
                        }
                    }
                }
            }
            if (data && Object.keys(data).length) {
                const collection = this.mongo.db.collection(moduleConfig.collections.main);
                await collection.updateMany(query, {
                    $set: data,
                }, {
                    upsert: false,
                });
            }
            return rep.code(200).send({});
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
