import fs from "fs-extra";
import path from "path";
import archiver from "archiver";
import throttle from "lodash.throttle";
import zlib from "node:zlib";
import * as tar from "tar";
import stream from "stream";
import unzip from "#lib/3rdparty/unzip-stream/unzip";
import FormData from "../data/process";
import FormValidator from "#lib/formValidatorServer";
import moduleConfig from "../module.js";
import Utils from "./utils";

export default () => ({
    async handler(req, rep) {
        const updateJob = async (jobId, data) => {
            this.mongo.db.collection(this.systemConfig.collections.jobs).findOneAndUpdate({
                _id: jobId,
            }, {
                $set: data,
            });
        };
        const updateJobThrottled = throttle((jobId, data) => updateJob(jobId, data), 900);
        const findJob = async jobId => this.mongo.db.collection(this.systemConfig.collections.jobs).findOne({
            _id: jobId,
        });
        const insertJob = async data => this.mongo.db.collection(this.systemConfig.collections.jobs).insertOne(data);
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
                const queueItemCopy = await insertJob({
                    updatedAt: new Date(),
                    userId: authData._id,
                    module: moduleConfig.id,
                    mode: requestData.action,
                    status: "new",
                });
                const jobIdCopy = queueItemCopy.insertedId;
                setTimeout(async () => {
                    try {
                        await updateJob(jobIdCopy, {
                            updatedAt: new Date(),
                            status: "processing",
                        });
                        let cancelled = false;
                        let count = 0;
                        for (const copyFile of requestData.files) {
                            if (cancelled) {
                                continue;
                            }
                            const jobData = await findJob(jobIdCopy);
                            if (!jobData || jobData.status === "cancelled") {
                                cancelled = true;
                                break;
                            }
                            if (requestData.action === "copy") {
                                await fs.copy(utils.getPath(`${requestData.srcDir}/${copyFile}`), utils.getPath(`${requestData.destDir}/${copyFile}`), {
                                    // eslint-disable-next-line no-loop-func
                                    filter: async () => {
                                        count += 1;
                                        if (cancelled) {
                                            return false;
                                        }
                                        const jobDataFile = await findJob(jobIdCopy);
                                        if (!jobDataFile || jobDataFile.status === "cancelled") {
                                            cancelled = true;
                                            return false;
                                        }
                                        await updateJobThrottled(jobIdCopy, {
                                            updatedAt: new Date(),
                                            count,
                                        });
                                        return !this.systemConfig.demo;
                                    },
                                });
                            } else {
                                count += 1;
                                if (!this.systemConfig.demo) {
                                    await fs.move(utils.getPath(`${requestData.srcDir}/${copyFile}`), utils.getPath(`${requestData.destDir}/${copyFile}`));
                                }
                                await updateJobThrottled(jobIdCopy, {
                                    updatedAt: new Date(),
                                    count,
                                });
                            }
                        }
                        const jobData = await findJob(jobIdCopy);
                        await updateJob(jobIdCopy, {
                            updatedAt: new Date(),
                            status: jobData.status === "cancelled" ? "cancelled" : "complete",
                        });
                    } catch (e) {
                        await updateJob(jobIdCopy, {
                            updatedAt: new Date(),
                            status: "error",
                            message: e.message,
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
                        await updateJob(jobIdDelete, {
                            status: "processing",
                            updatedAt: new Date(),
                        });
                        for (const deleteFile of requestData.files) {
                            const jobData = await findJob(jobIdDelete);
                            if (!jobData || jobData.status === "cancelled") {
                                break;
                            }
                            count += 1;
                            if (!this.systemConfig.demo) {
                                await fs.remove(utils.getPath(`${requestData.srcDir}/${deleteFile}`));
                            }
                            await updateJobThrottled(jobIdDelete, {
                                updatedAt: new Date(),
                                count,
                            });
                        }
                        const jobData = await findJob(jobIdDelete);
                        await updateJob(jobIdDelete, {
                            updatedAt: new Date(),
                            status: jobData.status === "cancelled" ? "cancelled" : "complete",
                        });
                    } catch (e) {
                        await updateJob(jobIdDelete, {
                            updatedAt: new Date(),
                            status: "error",
                            message: e.message,
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
                    let cancelled = false;
                    await updateJob(jobIdUnzip, {
                        updatedAt: new Date(),
                        status: "processing",
                    });
                    try {
                        fs.createReadStream(unzipSrcPath).pipe(unzip.Parse())
                            .on("entry", async entry => {
                                if (cancelled) {
                                    entry.autodrain();
                                    return;
                                }
                                const jobDataFile = findJob(jobIdUnzip);
                                if (!jobDataFile || jobDataFile.status === "cancelled") {
                                    entry.autodrain();
                                    cancelled = true;
                                    return;
                                }
                                const {
                                    type,
                                    path: entryPath,
                                } = entry;
                                const filePath = path.resolve(`${unzipSrcDirPath}/${entryPath}`);
                                if (type === "Directory") {
                                    if (!this.systemConfig.demo) {
                                        await fs.ensureDir(filePath);
                                    }
                                    entry.autodrain();
                                    return;
                                }
                                const entryDirName = path.dirname(filePath);
                                if (!this.systemConfig.demo) {
                                    await fs.ensureDir(entryDirName);
                                    entry.pipe(fs.createWriteStream(filePath));
                                } else {
                                    entry.autodrain();
                                }
                                count += 1;
                                await updateJobThrottled(jobIdUnzip, {
                                    updatedAt: new Date(),
                                    count,
                                });
                            })
                            .on("close", async () => {
                                const jobDataFile = await findJob(jobIdUnzip);
                                await updateJob(jobIdUnzip, {
                                    updatedAt: new Date(),
                                    status: jobDataFile.status === "cancelled" || cancelled ? "cancelled" : "complete",
                                });
                            })
                            .on("reject", () => {
                                updateJob(jobIdUnzip, {
                                    updatedAt: new Date(),
                                    status: "error",
                                    message: null,
                                });
                            });
                    } catch (e) {
                        updateJob(jobIdUnzip, {
                            updatedAt: new Date(),
                            status: "error",
                            message: e.message,
                        });
                    }
                });
                return rep.code(200).send({
                    id: jobIdUnzip.toString(),
                });
            case "archive":
                const archiveSrcDirPath = utils.getPath(requestData.srcDir);
                if (!(await utils.fileExists(archiveSrcDirPath))) {
                    return rep.error({
                        message: "Invalid directory",
                    });
                }
                if (!requestData.destFile || !requestData.compressionFormat || typeof requestData.compressionLevel !== "number") {
                    return rep.error({
                        message: "Invalid parameters",
                    });
                }
                for (const file of requestData.files) {
                    if (!(await utils.fileExists(utils.getPath(`${requestData.srcDir}/${file}`)))) {
                        return rep.error({
                            message: "One or more files or folders could not be found",
                        });
                    }
                }
                const archiveDestPath = utils.getPath(`${requestData.srcDir}/${requestData.destFile}.${requestData.compressionFormat}`);
                const queueItemArchive = await this.mongo.db.collection(this.systemConfig.collections.jobs).insertOne({
                    updatedAt: new Date(),
                    userId: authData._id,
                    module: moduleConfig.id,
                    mode: "archive",
                    status: "new",
                });
                const jobIdArchive = queueItemArchive.insertedId;
                setTimeout(async () => {
                    await updateJob(jobIdArchive, {
                        updatedAt: new Date(),
                        status: "processing",
                    });
                    try {
                        const format = requestData.compressionFormat === "tgz" ? "tar" : requestData.compressionFormat;
                        if (this.systemConfig.demo) {
                            await updateJob(jobIdArchive, {
                                updatedAt: new Date(),
                                status: "complete",
                            });
                        } else {
                            const archive = archiver(format, {
                                zlib: requestData.compressionFormat === "zip" ? {
                                    level: requestData.compressionLevel,
                                } : undefined,
                                gzip: requestData.compressionFormat === "tgz" ? {
                                    level: requestData.compressionLevel,
                                } : undefined,
                            });
                            const archiveOutput = fs.createWriteStream(archiveDestPath);
                            archive.pipe(archiveOutput);
                            archiveOutput.on("error", e => {
                                updateJob(jobIdArchive, {
                                    updatedAt: new Date(),
                                    status: "error",
                                    message: e.message,
                                });
                            });
                            archiveOutput.on("close", async () => {
                                const jobData = await findJob(jobIdArchive);
                                await updateJob(jobIdArchive, {
                                    updatedAt: new Date(),
                                    status: jobData.status === "cancelled" ? "cancelled" : "complete",
                                });
                            });
                            archive.on("progress", async progressData => {
                                const jobDataFile = await findJob(jobIdArchive);
                                if (!jobDataFile || jobDataFile.status === "cancelled") {
                                    archive.abort();
                                    return;
                                }
                                updateJobThrottled(jobIdArchive, {
                                    updatedAt: new Date(),
                                    count: progressData.entries.processed,
                                });
                            });
                            archive.on("error", e => {
                                updateJob(jobIdArchive, {
                                    updatedAt: new Date(),
                                    status: "error",
                                    message: e.message,
                                });
                            });
                            for (const file of requestData.files) {
                                const jobDataFile = await findJob(jobIdArchive);
                                if (!jobDataFile || jobDataFile.status === "cancelled") {
                                    break;
                                }
                                const archiveFilePath = utils.getPath(`${requestData.srcDir}/${file}`);
                                const archiveFileStat = await fs.lstat(archiveFilePath);
                                if (archiveFileStat.isDirectory()) {
                                    archive.directory(archiveFilePath, file);
                                } else {
                                    archive.append(fs.createReadStream(archiveFilePath), {
                                        name: file,
                                    });
                                }
                            }
                            archive.finalize();
                        }
                    } catch (e) {
                        updateJob(jobIdArchive, {
                            updatedAt: new Date(),
                            status: "error",
                            message: e.message,
                        });
                    }
                });
                return rep.code(200).send({
                    id: jobIdArchive.toString(),
                });
            case "untar":
            case "untgz":
                const untarSrcDirPath = utils.getPath(requestData.srcDir);
                if (!(await utils.fileExists(untarSrcDirPath))) {
                    return rep.error({
                        message: "Invalid directory",
                    });
                }
                if (!requestData.srcFile) {
                    return rep.error({
                        message: "Invalid parameters",
                    });
                }
                const untarSrcPath = utils.getPath(`${requestData.srcDir}/${requestData.srcFile}`);
                if (!(await utils.fileExists(untarSrcPath))) {
                    return rep.error({
                        message: "File doesn't exist",
                    });
                }
                const queueItemUntar = await this.mongo.db.collection(this.systemConfig.collections.jobs).insertOne({
                    updatedAt: new Date(),
                    userId: authData._id,
                    module: moduleConfig.id,
                    mode: requestData.action,
                    status: "new",
                });
                const jobIdUntar = queueItemUntar.insertedId;
                setTimeout(async () => {
                    let count = 0;
                    let cancelled = false;
                    await updateJob(jobIdUntar, {
                        updatedAt: new Date(),
                        status: "processing",
                    });
                    try {
                        const onUntarEntry = async entry => {
                            if (cancelled) {
                                // Drain
                                entry.pipe(new stream.Transform({
                                    transform(d, e, cb) {
                                        cb();
                                    }
                                }));
                                return;
                            }
                            const jobDataFile = findJob(jobIdUntar);
                            if (!jobDataFile || jobDataFile.status === "cancelled") {
                                cancelled = true;
                                // Drain
                                entry.pipe(new stream.Transform({
                                    transform(d, e, cb) {
                                        cb();
                                    }
                                }));
                                return;
                            }
                            const {
                                type,
                                path: entryPath,
                            } = entry;
                            const filePath = path.resolve(`${untarSrcDirPath}/${entryPath}`);
                            if (type === "Directory") {
                                if (!this.systemConfig.demo) {
                                    await fs.ensureDir(filePath);
                                }
                                // Drain
                                entry.pipe(new stream.Transform({
                                    transform(d, e, cb) {
                                        cb();
                                    }
                                }));
                                return;
                            }
                            const entryDirName = path.dirname(filePath);
                            if (!this.systemConfig.demo) {
                                await fs.ensureDir(entryDirName);
                                entry.pipe(fs.createWriteStream(filePath));
                            } else {
                                // Drain
                                entry.pipe(new stream.Transform({
                                    transform(d, e, cb) {
                                        cb();
                                    }
                                }));
                            }
                            count += 1;
                            await updateJobThrottled(jobIdUntar, {
                                updatedAt: new Date(),
                                count,
                            });
                        };
                        fs.createReadStream(untarSrcPath)
                            .pipe(requestData.action === "untgz" ? zlib.Unzip() : new stream.Transform({
                                transform(chunk, encoding, callback) {
                                    callback(null, chunk);
                                }
                            }))
                            .pipe(new tar.Parser())
                            .on("entry", async entry => {
                                onUntarEntry(entry);
                            })
                            .on("end", async () => {
                                const jobDataFile = await findJob(jobIdUntar);
                                await updateJob(jobIdUntar, {
                                    updatedAt: new Date(),
                                    status: jobDataFile.status === "cancelled" || cancelled ? "cancelled" : "complete",
                                });
                            })
                            .on("error", e => {
                                updateJob(jobIdUntar, {
                                    updatedAt: new Date(),
                                    status: "error",
                                    message: e.message,
                                });
                            });
                    } catch (e) {
                        updateJob(jobIdUntar, {
                            updatedAt: new Date(),
                            status: "error",
                            message: e.message,
                        });
                    }
                });
                return rep.code(200).send({
                    id: jobIdUntar.toString(),
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
