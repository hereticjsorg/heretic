import Cryptr from "cryptr";
import Captcha from "../../core/captcha";

const captcha = new Captcha();

export default () => ({
    async handler(req, rep) {
        try {
            const cryptr = new Cryptr(this.siteConfig.secret);
            // c = code
            const c = Math.random().toString().substring(2, 6);
            const imageData = captcha.createCaptcha(c);
            // t = current timestamp
            const t = new Date().getTime();
            const imageSecret = cryptr.encrypt(JSON.stringify({
                c,
                t
            }));
            // Send response
            return rep.code(200).send({
                imageData,
                imageSecret
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
