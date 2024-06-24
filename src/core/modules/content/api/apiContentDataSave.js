import {
    createHash,
} from "crypto";
import FormData from "../data/contentForm";
import FormValidator from "#lib/formValidatorServer";
import moduleConfig from "../module.js";
import languages from "#etc/languages.json";

const dataId = moduleConfig.id;

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
            let editorContent;
            try {
                editorContent = multipartData && multipartData.fields && multipartData.fields.editorContent && typeof multipartData.fields.editorContent === "string" ? JSON.parse(multipartData.fields.editorContent) : null;
            } catch {
                //
            }
            if (validationResult || !editorContent) {
                await formValidator.cleanUpFiles();
                return rep.error({
                    form: validationResult,
                });
            }
            const collection = this.mongo.db.collection(moduleConfig.collections.content);
            const result = {};
            for (const k of Object.keys(languages)) {
                if (data[k]) {
                    if (!result.title) {
                        result.title = data[k].title;
                    }
                    if (!data.pagePath) {
                        data.pagePath = data[k].pagePath;
                    }
                    delete data[k].pagePath;
                }
                if (editorContent[k]) {
                    data[k].content = editorContent[k];
                }
            }
            data.pagePath = data.pagePath || [];
            data.pagePathHash = createHash("sha256").update(data.pagePath.join("/")).digest("base64");
            data.pagePathText = `/${data.pagePath.join("/")}`;
            const duplicateRecord = await collection.findOne({
                pagePathHash: data.pagePathHash,
            });
            if (data._id) {
                if (duplicateRecord && String(duplicateRecord._id) !== String(data._id)) {
                    return rep.error({
                        duplicate: true,
                        message: "duplicateRecord",
                    });
                }
                const existingRecord = await collection.findOne({
                    _id: data._id,
                });
                if (!existingRecord) {
                    throw new Error("Not found");
                }
                if (!this.systemConfig.demo) {
                    await collection.updateOne({
                        _id: data._id,
                    }, {
                        $set: data,
                    });
                    await formValidator.saveFiles(dataId, String(data._id));
                }
            } else if (!this.systemConfig.demo) {
                if (duplicateRecord) {
                    return rep.error({
                        duplicate: true,
                        message: "duplicateRecord",
                    });
                }
                const insertResult = await collection.insertOne({
                    ...data,
                });
                result.insertedId = insertResult.insertedId;
                await formValidator.saveFiles(dataId, String(insertResult.insertedId));
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
