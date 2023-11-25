import BinUtils from "#lib/binUtils.js";

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
            if (!this.systemConfig.demo) {
                if (!this.systemConfig.heretic.restartCommand) {
                    setTimeout(() => process.exit(0), 2000);
                } else {
                    const restartCommand = this.systemConfig.heretic.restartCommand.replace(/\[id\]/gm, this.systemConfig.id);
                    try {
                        await binUtils.executeCommand(restartCommand);
                    } catch {
                        //
                    }
                }
            }
            return rep.success({});
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
