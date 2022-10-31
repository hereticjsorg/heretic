const os = require("os");
const packageJson = require("../../../../package.json");

export default () => ({
    async handler(req, rep) {
        const authData = await req.auth.getData(req.auth.methods.HEADERS);
        if (!authData || !authData.groupData || !authData.groupData.admin) {
            return rep.error({
                message: "Access Denied",
            }, 403);
        }
        try {
            return rep.success({
                hereticVersion: packageJson.version,
                osType: os.type(),
                osRelease: os.release(),
                osPlatform: os.platform(),
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
