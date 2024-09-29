import { Totp } from "time2fa";

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
        const key = Totp.generateKey({
            issuer: "Heretic",
            user: authData.username,
        });
        return rep.success({
            url: key.url,
            secret: key.secret,
        });
    },
});
