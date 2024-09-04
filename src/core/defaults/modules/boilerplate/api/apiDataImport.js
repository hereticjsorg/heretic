import Ajv from "ajv";
import FormData from "../data/form.js";
import requestData from "../data/request.js";
import FormValidator from "#lib/formValidatorServer.js";
import moduleConfig from "../module.js";
import utils from "./utils.js";

const ajv = new Ajv();
const requestValidation = ajv.compile(requestData);

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
            if (!requestValidation(req.body)) {
                return rep.error({
                    message: "Missing import data",
                    errors: requestValidation.errors,
                });
            }
            const collection = this.mongo.db.collection(
                moduleConfig.collections.main,
            );
            let successCount = 0;
            let failCount = 0;
            for (const item of req.body.items) {
                const validationResult = formValidator.validateImport(item);
                if (
                    validationResult &&
                    !validationResult.length &&
                    utils.isSaveAllowed(authData, item) &&
                    !this.systemConfig.demo
                ) {
                    const updateQuery = {};
                    for (const i of req.body.update) {
                        updateQuery[i] = item[i];
                    }
                    if (req.body.update.length) {
                        await collection.updateOne(
                            updateQuery,
                            {
                                $set: item,
                            },
                            {
                                upsert: false,
                            },
                        );
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
                            counterData && counterData.seq
                                ? counterData.seq
                                : 1;
                        await collection.insertOne({
                            ...item,
                            id: seq,
                        });
                    }
                    successCount += 1;
                } else if (!this.systemConfig.demo) {
                    failCount += 1;
                }
            }
            return rep.code(200).send({
                successCount,
                failCount,
            });
        } catch (e) {
            await formValidator.cleanUpFiles();
            this.log.error(e);
            return Promise.reject(e);
        }
    },
});
