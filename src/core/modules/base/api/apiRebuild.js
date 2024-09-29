import BinUtils from "#lib/binUtils.js";
import moduleConfig from "../module.js";
import buildJson from "#build/build.json";

const binUtils = new BinUtils({});

export default () => ({
    async handler(req, rep) {
        const authData = await req.auth.getData(req.auth.methods.COOKIE);
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
        try {
            const delay = (ms) =>
                new Promise((resolve) => {
                    setTimeout(resolve, ms);
                });
            const insertJob = async (data) =>
                this.mongo.db
                    .collection(this.systemConfig.collections.jobs)
                    .insertOne(data);
            const updateJob = async (jobId, data) => {
                this.mongo.db
                    .collection(this.systemConfig.collections.jobs)
                    .findOneAndUpdate(
                        {
                            _id: jobId,
                        },
                        {
                            $set: data,
                        },
                    );
            };
            const findJob = async (jobId) =>
                this.mongo.db
                    .collection(this.systemConfig.collections.jobs)
                    .findOne({
                        _id: jobId,
                    });
            const existingJob = await this.mongo.db
                .collection(this.systemConfig.collections.jobs)
                .findOne({
                    module: moduleConfig.id,
                    mode: "rebuild",
                });
            if (existingJob) {
                return rep.error({});
            }
            const updateJobDb = await insertJob({
                updatedAt: new Date(),
                userId: authData._id,
                module: moduleConfig.id,
                mode: "rebuild",
                status: "new",
            });
            const jobId = updateJobDb.insertedId;
            setTimeout(async () => {
                try {
                    await updateJob(jobId, {
                        updatedAt: new Date(),
                        status: "processing",
                    });
                    let jobData = await findJob(jobId);
                    const rebuildInterval = setInterval(
                        () =>
                            updateJob(jobId, {
                                updatedAt: new Date(),
                            }),
                        5000,
                    );
                    try {
                        await updateJob(jobId, {
                            status: "runInstall",
                        });
                        if (this.systemConfig.demo) {
                            await delay(5000);
                        } else {
                            const installResult = await binUtils.executeCommand(
                                "npm run install-modules",
                            );
                            if (installResult.exitCode !== 0) {
                                throw new Error("installError");
                            }
                        }
                        await updateJob(jobId, {
                            status: "runBuild",
                        });
                        if (this.systemConfig.demo) {
                            await delay(30000);
                        } else {
                            const buildCommand = buildJson.production
                                ? "npm run build"
                                : "npm run build -- --dev";
                            const buildResult =
                                await binUtils.executeCommand(buildCommand);
                            if (buildResult.exitCode !== 0) {
                                throw new Error("buildError");
                            }
                        }
                    } catch (e) {
                        await updateJob(jobId, {
                            updatedAt: new Date(),
                            status: "error",
                            message: e.message,
                        });
                    } finally {
                        clearInterval(rebuildInterval);
                    }
                    jobData = await findJob(jobId);
                    await updateJob(jobId, {
                        updatedAt: new Date(),
                        status:
                            jobData.status === "error" ? "error" : "complete",
                    });
                } catch (e) {
                    await updateJob(jobId, {
                        updatedAt: new Date(),
                        status: "error",
                        message: e.message,
                    });
                }
                if (!this.systemConfig.demo) {
                    setTimeout(() => {
                        try {
                            if (this.systemConfig.heretic.restartCommand) {
                                const restartCommand =
                                    this.systemConfig.heretic.restartCommand.replace(
                                        /\[id\]/gm,
                                        this.systemConfig.id,
                                    );
                                binUtils.executeCommand(restartCommand);
                            } else {
                                process.exit(0);
                            }
                        } catch {
                            // Ignore
                        }
                    }, 1500);
                }
            });
            return rep.code(200).send({
                id: jobId.toString(),
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    },
});
