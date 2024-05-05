import {
    v4 as uuid,
} from "uuid";
import Captcha from "#lib/captcha";

const captcha = new Captcha();

export default () => ({
    async handler(req, rep) {
        try {
            const code = Math.random().toString().substring(2, 6);
            const imageSecret = uuid();
            const imageData = captcha.createCaptcha(code);
            if (!this.systemConfig.redis.enabled && this.systemConfig.mongo.enabled) {
                return rep.error({
                    message: "No MongoDB or Redis enabled",
                });
            }
            if (this.redis) {
                await this.redis.set(`${this.siteConfig.id}_captcha_${imageSecret}}`, code, "ex", 300);
            } else {
                await this.mongo.db.collection(this.systemConfig.collections.captcha).insertOne({
                    _id: imageSecret,
                    code,
                    createdAt: new Date(),
                });
            }
            // Send response
            return rep.code(200).send({
                imageData,
                imageSecret,
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
