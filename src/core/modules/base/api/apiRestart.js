import BinUtils from "#lib/binUtils.js";

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
            return rep.success({});
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    },
});
