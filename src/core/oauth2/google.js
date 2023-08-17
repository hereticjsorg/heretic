import axios from "axios";
import Utils from "./utils";

export default () => ({
    async handler(req, rep) {
        try {
            const utils = new Utils(this, req);
            let flowData;
            try {
                flowData = await this.oa2google.getAccessTokenFromAuthorizationCodeFlow(req);
            } catch {
                // Ignore
            }
            if (!flowData || !flowData.token || !flowData.token.access_token) {
                return await utils.renderPage(rep);
            }
            let data;
            try {
                const userInfoResponse = await axios({
                    method: "get",
                    url: "https://www.googleapis.com/oauth2/v2/userinfo",
                    headers: {
                        Authorization: `Bearer ${flowData.token.access_token}`,
                    },
                });
                data = userInfoResponse.data;
            } catch {
                return await utils.renderPage(rep);
            }
            if (!data || !data.email || !data.verified_email) {
                return await utils.renderPage(rep);
            }
            const userDb = (await this.mongo.db.collection(this.systemConfig.collections.users).findOne({
                email: data.email,
            })) || {};
            if (!userDb) {
                await utils.signUp(data.email, data.name || null);
            }
            const token = userDb.tfaConfig ? await utils.signIn2FA(data.email) : await utils.signIn(data.email);
            return await utils.renderPage(rep, token, userDb.tfaConfig);
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
