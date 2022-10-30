import FormData from "../data/form";
import FormValidator from "../../../lib/formValidatorServer";
import moduleConfig from "../admin.js";

const uniqueFields = ["username", "email"];

export default () => ({
    async handler(req, rep) {
        let formValidator;
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (!authData || !authData.groupData || !authData.groupData.admin) {
                return rep.error({
                    message: "Access Denied",
                }, 403);
            }
            const multipartData = await req.processMultipart();
            const formData = new FormData();
            if (multipartData && multipartData.fields && multipartData.fields.id) {
                formData.data.form[0].fields.find(i => i.id === "password").mandatory = false;
                formData.data.form[0].fields.find(i => i.id === "password").validation.type = ["string", "null"];
            }
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
            await formValidator.saveFiles(moduleConfig.id);
            const collection = this.mongo.db.collection(moduleConfig.collections.main);
            const result = {};
            data._default.email = data._default.email ? data._default.email.toLowerCase() : null;
            data._default.username = data._default.username ? data._default.username.toLowerCase() : null;
            if (data._id) {
                const existingRecord = await collection.findOne({
                    _id: data._id,
                });
                if (!existingRecord) {
                    throw new Error("Not found");
                }
                const duplicateErrors = await this.findDatabaseDuplicates(moduleConfig.collections.main, uniqueFields, data._default, existingRecord);
                if (duplicateErrors) {
                    return rep.error(duplicateErrors);
                }
                if (data._default.password) {
                    data._default.password = await req.auth.createHash(`${data._default.password}${this.siteConfig.secret}`);
                } else {
                    delete data._default.password;
                }
                await collection.updateOne({
                    _id: data._id,
                }, {
                    $set: data._default,
                });
                await formValidator.unlinkRemovedFiles({
                    _default: existingRecord,
                });
            } else {
                const duplicateErrors = await this.findDatabaseDuplicates(moduleConfig.collections.main, uniqueFields, data._default, null);
                if (duplicateErrors) {
                    return rep.error(duplicateErrors);
                }
                const insertResult = await collection.insertOne({
                    ...data._default,
                });
                result.insertedId = insertResult.insertedId;
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
