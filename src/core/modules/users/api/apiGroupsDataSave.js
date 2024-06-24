import FormData from "../data/groupsForm";
import FormValidator from "#lib/formValidatorServer";
import moduleConfig from "../module.js";

const dataId = "groups";
const uniqueFields = ["group"];

export default () => ({
    async handler(req, rep) {
        let formValidator;
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (!authData || !authData.groupData || !authData.groupData.find(i => i.id === "admin" && i.value === true)) {
                return rep.error({
                    message: "Access Denied",
                }, 403);
            }
            let multipartData;
            try {
                multipartData = await req.processMultipart();
            } catch (e) {
                await req.removeMultipartTempFiles();
                return rep.error({
                    message: e.message,
                });
            }
            const formData = new FormData();
            formValidator = new FormValidator(formData.getValidationSchema(), formData.getFieldsFlat(), this);
            const {
                data,
            } = formValidator.parseMultipartData(multipartData);
            const validationResult = formValidator.validate();
            if (validationResult) {
                await formValidator.cleanUpFiles();
                return rep.error({
                    form: validationResult,
                });
            }
            const collection = this.mongo.db.collection(moduleConfig.collections.groups);
            const result = {};
            data._default.group = data._default.group ? data._default.group.toLowerCase() : null;
            if (data._id) {
                const existingRecord = await collection.findOne({
                    _id: data._id,
                });
                if (!existingRecord) {
                    throw new Error("Not found");
                }
                const duplicateErrors = await this.findDatabaseDuplicates(moduleConfig.collections.groups, uniqueFields, data._default, existingRecord);
                if (duplicateErrors) {
                    return rep.error(duplicateErrors);
                }
                if (!this.systemConfig.demo) {
                    await collection.updateOne({
                        _id: data._id,
                    }, {
                        $set: data._default,
                    });
                    await formValidator.saveFiles(dataId, String(data._id));
                    await formValidator.unlinkRemovedFiles({
                        _default: existingRecord,
                    });
                }
            } else {
                const duplicateErrors = await this.findDatabaseDuplicates(moduleConfig.collections.groups, uniqueFields, data._default, null);
                if (duplicateErrors) {
                    return rep.error(duplicateErrors);
                }
                if (!this.systemConfig.demo) {
                    const insertResult = await collection.insertOne({
                        ...data._default,
                    });
                    result.insertedId = insertResult.insertedId;
                    await formValidator.saveFiles(dataId, String(result.insertedId));
                }
            }
            return rep.code(200).send(result);
        } catch (e) {
            if (formValidator) {
                await formValidator.cleanUpFiles();
            }
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
