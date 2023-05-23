import {
    v4 as uuid,
} from "uuid";
import crypto from "crypto";
import modal from "./modal.marko";

export default class {
    constructor(fastify, req) {
        this.fastify = fastify;
        this.req = req;
    }

    async signUp(email, displayName = null) {
        const passwordHash = await this.req.auth.createHash(`${uuid()}${this.fastify.systemConfig.secret}`);
        const nameParts = email.replace(/@.+/, "");
        let username = nameParts.replace(/[&/\\#,+()$~%._@'":*?<>{}]/g, "");
        const checkUserFull = await this.fastify.mongo.db.collection(this.fastify.systemConfig.collections.users).findOne({
            username,
        });
        if (checkUserFull) {
            username = nameParts.replace(/[&/\\#,+()$~%._@'":*?<>{}]/g, "") + crypto.randomInt(1000, 9000).toString();
            const checkUserNum = await this.fastify.mongo.db.collection(this.fastify.systemConfig.collections.users).findOne({
                username,
            });
            if (checkUserNum) {
                username = `a${Date.now()}`;
            }
        }
        await this.fastify.mongo.db.collection(this.fastify.systemConfig.collections.users).insertOne({
            username,
            email,
            password: passwordHash,
            groups: null,
            displayName,
            active: true,
        });
    }

    async signIn(email) {
        const userDb = await this.req.auth.authorize(email);
        if (!userDb) {
            await this.req.addEvent("loginFail", {}, {
                username: email
            });
            return this.rep.error({
                message: "error_invalid_credentials"
            }, 403);
        }
        const token = this.req.auth.generateToken(String(userDb._id), userDb.sid);
        await this.req.addEvent("loginSuccess", userDb);
        return token;
    }

    async renderPage(rep, token = null) {
        const out = await modal.render({
            token,
        });
        rep.type("text/html");
        return out.toString();
    }
}
