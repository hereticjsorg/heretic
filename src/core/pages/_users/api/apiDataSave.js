import FormData from "../data/form";
import FormValidator from "../../../lib/formValidatorServer";
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
            const multipartData = await req.processMultipart();
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
            if (data._id) {
                const existingRecord = await collection.findOne({
                    _id: data._id,
                });
                if (!existingRecord) {
                    throw new Error("Not found");
                }
                await collection.updateOne({
                    _id: data._id,
                }, {
                    $set: data._default,
                });
                if (formData.getHistoryConfig().enabled) {
                    const changes = await req.findUpdates(formData, existingRecord, data._default, {
                        ignore: ["_id", "id"]
                    });
                    if (changes.length) {
                        await this.mongo.db.collection(this.siteConfig.collections.history).insertOne({
                            recordId: data._id.toString(),
                            userId: authData._id.toString(),
                            updated: new Date(),
                            changes,
                            data: data._default,
                            module: moduleConfig.id,
                        });
                    }
                } else {
                    await formValidator.unlinkRemovedFiles({
                        _default: existingRecord,
                    });
                }
                result.id = existingRecord.id;
            } else {
                const counterData = await this.mongo.db.collection(this.siteConfig.collections.counters).findOneAndUpdate({
                    _id: moduleConfig.id,
                }, {
                    $inc: {
                        seq: 1,
                    }
                }, {
                    returnNewDocument: true,
                    upsert: true,
                });
                const seq = counterData && counterData.value && counterData.value.seq ? counterData.value.seq : 1;
                const insertResult = await collection.insertOne({
                    id: seq,
                    ...data._default,
                });
                result.insertedId = insertResult.insertedId;
                result.id = seq;
                if (formData.getHistoryConfig().enabled) {
                    await this.mongo.db.collection(this.siteConfig.collections.history).insertOne({
                        recordId: result.insertedId.toString(),
                        userId: authData._id.toString(),
                        updated: new Date(),
                        changes: null,
                        data: data._default,
                        module: moduleConfig.id,
                    });
                }
            }
            return rep.code(200).send(result);
        } catch (e) {
            await formValidator.cleanUpFiles();
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
