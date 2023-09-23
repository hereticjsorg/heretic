import fs from "fs-extra";
import FormData from "../data/process";
import FormValidator from "#lib/formValidatorServer";
import moduleConfig from "../module.js";
import Utils from "./utils";

const utils = new Utils();

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
                return rep.error({
                    form: validationResult,
                });
            }
            const requestData = data._default;
            switch (requestData.action) {
            case "move":
            case "copy":
                const copySrcDirPath = utils.getPath(requestData.srcDir);
                const copyDestDirPath = utils.getPath(requestData.destDir);
                if (!(await utils.fileExists(copySrcDirPath)) || !(await utils.fileExists(copyDestDirPath))) {
                    return rep.error({
                        message: "Invalid directory",
                    });
                }
                for (const copyFile of requestData.files) {
                    if (!(await utils.fileExists(utils.getPath(`${requestData.srcDir}/${copyFile}`)))) {
                        return rep.error({
                            message: "File not found",
                        });
                    }
                }
                const queueItemCopy = await this.mongo.db.collection(this.systemConfig.collections.jobs).insertOne({
                    updatedAt: new Date(),
                    userId: authData._id,
                    module: moduleConfig.id,
                    mode: requestData.action,
                    status: "new",
                });
                const jobIdCopy = queueItemCopy.insertedId;
                setTimeout(async () => {
                    let count = 0;
                    try {
                        for (const copyFile of requestData.files) {
                            const jobData = await this.mongo.db.collection(this.systemConfig.collections.jobs).findOneAndUpdate({
                                _id: jobIdCopy,
                            }, {
                                $set: {
                                    updatedAt: new Date(),
                                    status: "processing",
                                },
                            });
                            if (!jobData || jobData.status === "cancelled") {
                                break;
                            }
                            let cancelled = false;
                            if (requestData.action === "copy") {
                                await fs.copy(utils.getPath(`${requestData.srcDir}/${copyFile}`), utils.getPath(`${requestData.destDir}/${copyFile}`), {
                                    // eslint-disable-next-line no-loop-func
                                    filter: async () => {
                                        count += 1;
                                        if (cancelled) {
                                            return false;
                                        }
                                        const jobDataFile = await this.mongo.db.collection(this.systemConfig.collections.jobs).findOneAndUpdate({
                                            _id: jobIdCopy,
                                        }, {
                                            $set: {
                                                updatedAt: new Date(),
                                                count,
                                            },
                                        });
                                        if (!jobDataFile || jobDataFile.status === "cancelled") {
                                            cancelled = true;
                                        }
                                        return true;
                                    },
                                });
                            } else {
                                count += 1;
                                await fs.move(utils.getPath(`${requestData.srcDir}/${copyFile}`), utils.getPath(`${requestData.destDir}/${copyFile}`));
                            }
                            await this.mongo.db.collection(this.systemConfig.collections.jobs).updateOne({
                                _id: jobIdCopy,
                            }, {
                                $set: {
                                    updatedAt: new Date(),
                                    status: (cancelled || jobData.status === "cancelled") ? "cancelled" : "complete",
                                    count,
                                },
                            });
                        }
                    } catch (e) {
                        await this.mongo.db.collection(this.systemConfig.collections.jobs).updateOne({
                            _id: jobIdCopy,
                        }, {
                            $set: {
                                updatedAt: new Date(),
                                status: "error",
                                message: e.message,
                            },
                        });
                    }
                });
                return rep.code(200).send({
                    id: jobIdCopy.toString(),
                });
            case "delete":
                break;
            }
            return rep.code(200).send({
                message: "No errors, but nothing to do as well"
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
