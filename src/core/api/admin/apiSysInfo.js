const os = require("os");
const packageJson = require("../../../../package.json");

export default () => ({
    async handler(req, rep) {
        const authData = await req.auth.getData(req.auth.methods.COOKIE);
        if (!authData || !authData.groupData || !authData.groupData.find(i => i.id === "admin" && i.value === true)) {
            return rep.error({
                message: "Access Denied",
            }, 403);
        }
        try {
            if (this.redis) {
                try {
                    const usersRecords = await this.redis.keys(`${this.siteConfig.id}_user_*`);
                    for (const item of usersRecords) {
                        const [, , userId] = item.split(/_/);
                        const lastSeen = await this.redis.get(item);
                    }
                } catch {
                    // Ignore
                }
            }
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
