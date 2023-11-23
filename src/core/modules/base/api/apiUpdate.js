import BinUtils from "#lib/binUtils.js";
import moduleConfig from "../module.js";
import buildJson from "#build/build.json";

const binUtils = new BinUtils({});

export default () => ({
    async handler(req, rep) {
        const authData = await req.auth.getData(req.auth.methods.COOKIE);
        if (!authData || !authData.groupData || !authData.groupData.find(i => i.id === "admin" && i.value === true)) {
            return rep.error({
                message: "Access Denied",
            }, 403);
        }
        try {
            const insertJob = async data => this.mongo.db.collection(this.systemConfig.collections.jobs).insertOne(data);
            const updateJob = async (jobId, data) => {
                this.mongo.db.collection(this.systemConfig.collections.jobs).findOneAndUpdate({
                    _id: jobId,
                }, {
                    $set: data,
                });
            };
            const findJob = async jobId => this.mongo.db.collection(this.systemConfig.collections.jobs).findOne({
                _id: jobId,
            });
            const updateJobDb = await insertJob({
                updatedAt: new Date(),
                userId: authData._id,
                module: moduleConfig.id,
                mode: "update",
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
                    const updateInterval = setInterval(() => updateJob(jobId, {
                        updatedAt: new Date(),
                    }), 5000);
                    try {
                        await updateJob(jobId, {
                            status: "runUpdate",
                        });
                        const updateResult = await binUtils.executeCommand("npm run update");
                        if (updateResult.exitCode !== 0) {
                            throw new Error("updateError");
                        }
                        await updateJob(jobId, {
                            status: "runInstall",
                        });
                        const installResult = await binUtils.executeCommand("npm i");
                        if (installResult.exitCode !== 0) {
                            throw new Error("installError");
                        }
                        await updateJob(jobId, {
                            status: "runBuild",
                        });
                        const buildCommand = buildJson.production ? "npm run build" : "npm run build -- --dev";
                        const buildResult = await binUtils.executeCommand(buildCommand);
                        if (buildResult.exitCode !== 0) {
                            throw new Error("buildError");
                        }
                    } catch (e) {
                        clearInterval(updateInterval);
                        await updateJob(jobId, {
                            updatedAt: new Date(),
                            status: "error",
                            message: e.message,
                        });
                    }
                    jobData = await findJob(jobId);
                    await updateJob(jobId, {
                        updatedAt: new Date(),
                        status: jobData.status === "error" ? "error" : "complete",
                    });
                } catch (e) {
                    await updateJob(jobId, {
                        updatedAt: new Date(),
                        status: "error",
                        message: e.message,
                    });
                }
            });
            return rep.code(200).send({
                id: jobId.toString(),
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
