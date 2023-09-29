import fs from "fs-extra";
import path from "path";
import unzip from "#lib/3rdparty/unzip-stream/unzip";
import FormData from "../data/process";
import FormValidator from "#lib/formValidatorServer";
import moduleConfig from "../module.js";
import Utils from "./utils";

export default () => ({
    async handler(req, rep) {
        const utils = new Utils(this);
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
            case "newDir":
                if (!requestData.destFile) {
                    return rep.error({
                        message: "Invalid parameters",
                    });
                }
                const newDirPath = utils.getPath(`${requestData.srcDir}/${requestData.destFile}`);
                if (!this.systemConfig.demo) {
                    await fs.ensureDir(newDirPath);
                }
                return rep.code(200).send({});
            case "rename":
                if (!requestData.srcFile || !requestData.destFile) {
                    return rep.error({
                        message: "Invalid parameters",
                    });
                }
                const renameSrcPath = utils.getPath(`${requestData.srcDir}/${requestData.srcFile}`);
                const renameDestPath = utils.getPath(`${requestData.srcDir}/${requestData.destFile}`);
                if (!this.systemConfig.demo) {
                    await fs.rename(renameSrcPath, renameDestPath);
                }
                return rep.code(200).send({});
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
                                        return !this.systemConfig.demo;
                                    },
                                });
                            } else {
                                count += 1;
                                if (!this.systemConfig.demo) {
                                    await fs.move(utils.getPath(`${requestData.srcDir}/${copyFile}`), utils.getPath(`${requestData.destDir}/${copyFile}`));
                                }
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
                const deleteSrcDirPath = utils.getPath(requestData.srcDir);
                if (!(await utils.fileExists(deleteSrcDirPath))) {
                    return rep.error({
                        message: "Invalid directory",
                    });
                }
                for (const deleteFile of requestData.files) {
                    if (!(await utils.fileExists(utils.getPath(`${requestData.srcDir}/${deleteFile}`)))) {
                        return rep.error({
                            message: "File not found",
                        });
                    }
                }
                const queueItemDelete = await this.mongo.db.collection(this.systemConfig.collections.jobs).insertOne({
                    updatedAt: new Date(),
                    userId: authData._id,
                    module: moduleConfig.id,
                    mode: "delete",
                    status: "new",
                });
                const jobIdDelete = queueItemDelete.insertedId;
                setTimeout(async () => {
                    let count = 0;
                    try {
                        for (const deleteFile of requestData.files) {
                            const jobData = await this.mongo.db.collection(this.systemConfig.collections.jobs).findOneAndUpdate({
                                _id: jobIdDelete,
                            }, {
                                $set: {
                                    updatedAt: new Date(),
                                    status: "processing",
                                },
                            });
                            if (!jobData || jobData.status === "cancelled") {
                                break;
                            }
                            count += 1;
                            if (!this.systemConfig.demo) {
                                await fs.remove(utils.getPath(`${requestData.srcDir}/${deleteFile}`));
                            }
                            await this.mongo.db.collection(this.systemConfig.collections.jobs).updateOne({
                                _id: jobIdDelete,
                            }, {
                                $set: {
                                    updatedAt: new Date(),
                                    status: jobData.status === "cancelled" ? "cancelled" : "complete",
                                    count,
                                },
                            });
                        }
                    } catch (e) {
                        await this.mongo.db.collection(this.systemConfig.collections.jobs).updateOne({
                            _id: jobIdDelete,
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
                    id: jobIdDelete.toString(),
                });
            case "unzip":
                const unzipSrcDirPath = utils.getPath(requestData.srcDir);
                if (!(await utils.fileExists(unzipSrcDirPath))) {
                    return rep.error({
                        message: "Invalid directory",
                    });
                }
                if (!requestData.srcFile) {
                    return rep.error({
                        message: "Invalid parameters",
                    });
                }
                const unzipSrcPath = utils.getPath(`${requestData.srcDir}/${requestData.srcFile}`);
                if (!(await utils.fileExists(unzipSrcPath))) {
                    return rep.error({
                        message: "File doesn't exist",
                    });
                }
                const queueItemUnzip = await this.mongo.db.collection(this.systemConfig.collections.jobs).insertOne({
                    updatedAt: new Date(),
                    userId: authData._id,
                    module: moduleConfig.id,
                    mode: "unzip",
                    status: "new",
                });
                const jobIdUnzip = queueItemUnzip.insertedId;
                setTimeout(async () => {
                    let count = 0;
                    const jobData = await this.mongo.db.collection(this.systemConfig.collections.jobs).findOneAndUpdate({
                        _id: jobIdUnzip,
                    }, {
                        $set: {
                            updatedAt: new Date(),
                            status: "processing",
                        },
                    });
                    if (!jobData || jobData.status === "cancelled") {
                        return;
                    }
                    try {
                        fs.createReadStream(unzipSrcPath).pipe(unzip.Parse())
                            .on("entry", async entry => {
                                const jobDataFile = this.mongo.db.collection(this.systemConfig.collections.jobs).findOne({
                                    _id: jobIdUnzip,
                                });
                                if (!jobDataFile || jobDataFile.status === "cancelled") {
                                    entry.autodrain();
                                    return;
                                }
                                const {
                                    type,
                                    path: entryPath,
                                } = entry;
                                const filePath = path.resolve(`${unzipSrcDirPath}/${entryPath}`);
                                if (type === "Directory") {
                                    await fs.ensureDir(filePath);
                                    entry.autodrain();
                                    return;
                                }
                                const entryDirName = path.dirname(filePath);
                                await fs.ensureDir(entryDirName);
                                if (!this.systemConfig.demo) {
                                    entry.pipe(fs.createWriteStream(filePath));
                                } else {
                                    entry.autodrain();
                                }
                                count += 1;
                                await this.mongo.db.collection(this.systemConfig.collections.jobs).updateOne({
                                    _id: jobIdUnzip,
                                }, {
                                    $set: {
                                        updatedAt: new Date(),
                                        count,
                                    },
                                });
                            })
                            .on("close", () => {
                                this.mongo.db.collection(this.systemConfig.collections.jobs).updateOne({
                                    _id: jobIdUnzip,
                                }, {
                                    $set: {
                                        updatedAt: new Date(),
                                        status: jobData.status === "cancelled" ? "cancelled" : "complete",
                                        count,
                                    },
                                });
                            })
                            .on("reject", () => {
                                this.mongo.db.collection(this.systemConfig.collections.jobs).updateOne({
                                    _id: jobIdUnzip,
                                }, {
                                    $set: {
                                        updatedAt: new Date(),
                                        status: "error",
                                        message: null,
                                    },
                                });
                            });
                    } catch (e) {
                        await this.mongo.db.collection(this.systemConfig.collections.jobs).updateOne({
                            _id: jobIdUnzip,
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
                    id: jobIdUnzip.toString(),
                });
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
