import FormData from "../data/form.js";
import FormValidator from "#lib/formValidatorServer.js";
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
            let multipartData;
            try {
                multipartData = await req.processMultipart();
            } catch (e) {
                await req.removeMultipartTempFiles();
                return rep.error({
                    message: e.message,
                });
            }
            const { data } = formValidator.parseMultipartData(multipartData);
            const validationResult = formValidator.validate();
            if (validationResult) {
                await formValidator.cleanUpFiles();
                return rep.error({
                    form: validationResult,
                });
            }
            if (
                !utils.isSaveAllowed(authData, data._default) ||
                this.systemConfig.demo
            ) {
                return rep.error(
                    {
                        message: "accessDenied",
                    },
                    403,
                );
            }
            const collection = this.mongo.db.collection(
                moduleConfig.collections.main,
            );
            const result = {};
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
                    delete data._default[k];
                }
            }
            if (data._id) {
                const existingRecord = await collection.findOne({
                    _id: data._id,
                });
                if (!existingRecord) {
                    throw new Error("Not found");
                }
                await collection.updateOne(
                    {
                        _id: data._id,
                    },
                    {
                        $set: data._default,
                    },
                );
                await formValidator.saveFiles(
                    moduleConfig.id,
                    String(data._id),
                );
                if (formData.getHistoryConfig().enabled) {
                    await utils.saveHistoryData(
                        this,
                        req,
                        formData,
                        existingRecord,
                        data,
                        authData,
                        access,
                    );
                } else {
                    await formValidator.unlinkRemovedFiles({
                        _default: existingRecord,
                    });
                }
                result.id = existingRecord.id;
            } else {
                const counterData = await this.mongo.db
                    .collection(this.systemConfig.collections.counters)
                    .findOneAndUpdate(
                        {
                            _id: moduleConfig.id,
                        },
                        {
                            $inc: {
                                seq: 1,
                            },
                        },
                        {
                            returnNewDocument: true,
                            upsert: true,
                        },
                    );
                const seq =
                    counterData && counterData.seq ? counterData.seq : 1;
                const insertResult = await collection.insertOne({
                    id: seq,
                    ...data._default,
                });
                result.insertedId = insertResult.insertedId;
                result.id = seq;
                await formValidator.saveFiles(
                    moduleConfig.id,
                    String(result.insertedId),
                );
                if (formData.getHistoryConfig().enabled) {
                    await utils.saveHistoryData(
                        this,
                        req,
                        formData,
                        null,
                        {
                            _id: result.insertedId,
                        },
                        authData,
                        access,
                    );
                }
            }
            return rep.code(200).send(result);
        } catch (e) {
            await formValidator.cleanUpFiles();
            this.log.error(e);
            return Promise.reject(e);
        }
    },
});
