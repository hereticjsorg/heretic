import FormData from "../data/usersForm.js";
import FormValidator from "#lib/formValidatorServer.js";
import moduleConfig from "../module.js";
import languages from "#etc/languages.json";

const uniqueFields = ["username", "email"];
const translation = {};
const dataId = "users";
for (const language of Object.keys(languages)) {
    translation[language] = require(`../translations/${language}.json`);
}

export default () => ({
    async handler(req, rep) {
        let formValidator;
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (
                !authData ||
                !authData.groupData ||
                !authData.groupData.find(
                    (i) => i.id === "admin" && i.value === true,
                )
            ) {
                return rep.error(
                    {
                        message: "Access Denied",
                    },
                    403,
                );
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
            if (
                multipartData &&
                multipartData.fields &&
                multipartData.fields.id
            ) {
                formData.data.form[0].fields.find(
                    (i) => i.id === "password",
                ).mandatory = false;
                formData.data.form[0].fields.find(
                    (i) => i.id === "password",
                ).validation.type = ["string", "null"];
            }
            formValidator = new FormValidator(
                formData.getValidationSchema(),
                formData.getFieldsFlat(),
                this,
            );
            const { data } = formValidator.parseMultipartData(multipartData);
            const validationResult = formValidator.validate();
            if (
                validationResult ||
                !multipartData.fields.language ||
                typeof multipartData.fields.language !== "string" ||
                multipartData.fields.language.length !== 5
            ) {
                await formValidator.cleanUpFiles();
                return rep.error({
                    form: validationResult,
                });
            }
            const language = translation[multipartData.fields.language]
                ? multipartData.fields.language
                : Object.keys(languages)[0];
            // eslint-disable-next-line no-unused-vars
            const t = (id, d = {}) =>
                typeof translation[language] === "function"
                    ? translation[language](d)
                    : translation[language] || id;
            const collection = this.mongo.db.collection(
                moduleConfig.collections.users,
            );
            const result = {};
            data._default.email = data._default.email
                ? data._default.email.toLowerCase()
                : null;
            data._default.username = data._default.username
                ? data._default.username.toLowerCase()
                : null;
            if (data._id) {
                const existingRecord = await collection.findOne({
                    _id: data._id,
                });
                if (!existingRecord) {
                    throw new Error("Not found");
                }
                const duplicateErrors = await this.findDatabaseDuplicates(
                    moduleConfig.collections.users,
                    uniqueFields,
                    data._default,
                    existingRecord,
                );
                if (duplicateErrors) {
                    return rep.error(duplicateErrors);
                }
                if (data._default.password) {
                    data._default.password = await req.auth.createHash(
                        `${data._default.password}${this.systemConfig.secret}`,
                    );
                } else {
                    delete data._default.password;
                }
                if (!this.systemConfig.demo) {
                    await collection.updateOne(
                        {
                            _id: data._id,
                        },
                        {
                            $set: data._default,
                        },
                    );
                    await formValidator.saveFiles(dataId, String(data._id));
                }
                await formValidator.unlinkRemovedFiles({
                    _default: existingRecord,
                });
            } else {
                const duplicateErrors = await this.findDatabaseDuplicates(
                    moduleConfig.collections.users,
                    uniqueFields,
                    data._default,
                    null,
                );
                if (duplicateErrors) {
                    return rep.error(duplicateErrors);
                }
                if (!this.systemConfig.demo) {
                    data._default.password = await req.auth.createHash(
                        `${data._default.password}${this.systemConfig.secret}`,
                    );
                    const insertResult = await collection.insertOne({
                        ...data._default,
                    });
                    result.insertedId = insertResult.insertedId;
                    await formValidator.saveFiles(
                        dataId,
                        String(insertResult.insertedId),
                    );
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
    },
});
