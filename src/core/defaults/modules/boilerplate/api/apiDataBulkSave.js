import FormValidator from "#lib/formValidatorServer.js";
import FormData from "../data/form.js";
import moduleConfig from "../module.js";
import utils from "./utils.js";

export default () => ({
    async handler(req, rep) {
        const formData = new FormData();
        const formValidator = new FormValidator(
            formData.getValidationSchema(),
            formData.getFieldsFlat(),
            this,
        );
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (!authData) {
                return rep.error({}, 403);
            }
            if (!req.validateDataBulk()) {
                return rep.error({
                    message: "validation_error",
                });
            }
            if (!this.systemConfig.demo) {
                const query = {
                    $and: [
                        {
                            ...(req.bulkUpdateQuery(formData) || {}),
                        },
                        {
                            ...(utils.filter({}, authData) || {}),
                        },
                    ],
                };
                const fields = formData.getFieldsFlat();
                const tabs = formData.getTabs
                    ? formData.getTabs().map((i) => i)
                    : ["_default"];
                const data = {};
                for (const item of req.body.bulkItems) {
                    for (const tab of item.tabs) {
                        const field = fields[item.id];
                        if (field && tabs.find((i) => i.id === tab)) {
                            if (tab === "_default") {
                                data[item.id] = formValidator.processValue(
                                    fields[item.id].type,
                                    item.value,
                                );
                            } else {
                                data[`${tab}.${item.id}`] =
                                    formValidator.processValue(
                                        fields[item.id].type,
                                        item.value,
                                    );
                            }
                        }
                    }
                }
                if (data && Object.keys(data).length) {
                    const collection = this.mongo.db.collection(
                        moduleConfig.collections.main,
                    );
                    const restrictedFields = formData.getRestrictedFields
                        ? formData.getRestrictedFields()
                        : [];
                    const restrictedAreas = formData.getRestrictedAreas
                        ? formData.getRestrictedAreas()
                        : [];
                    const { access } = utils.getAccessData(
                        restrictedFields,
                        restrictedAreas,
                        formData.getFieldsArea ? formData.getFieldsArea() : {},
                        authData,
                        {
                            projection: {},
                        },
                    );
                    for (const k of Object.keys(access)) {
                        if (access[k] === false) {
                            delete data[k];
                        }
                    }
                    await collection.updateMany(
                        query,
                        {
                            $set: data,
                        },
                        {
                            upsert: false,
                        },
                    );
                }
            }
            return rep.code(200).send({});
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    },
});
