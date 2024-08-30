import fs from "fs-extra";
import path from "path";
import moduleConfig from "../module";

export default () => ({
    async handler(req, rep) {
        const authData = await req.auth.getData(req.auth.methods.COOKIE);
        if (!authData) {
            return rep.error(
                {
                    message: "Access Denied",
                },
                403,
            );
        }
        delete authData.password;
        delete authData.sid;
        delete authData.groupData;
        authData.userId = authData._id;
        delete authData.tfaConfig;
        authData.sessionId = authData.session._id;
        delete authData.session;
        try {
            const profilePicturePath = path.resolve(
                __dirname,
                "public",
                moduleConfig.profilePicture.directory,
                `profile_${String(authData._id)}.jpg`,
            );
            await fs.access(profilePicturePath, fs.F_OK);
            authData.profilePicturePath = `/${moduleConfig.profilePicture.directory}/profile_${String(authData._id)}.jpg`;
        } catch {
            // Ignore
        }
        delete authData._id;
        return rep.success({
            ...authData,
        });
    },
});
