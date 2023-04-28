import Ajv from "ajv";
import Captcha from "../../lib/captcha";
import Password from "../../lib/password";
import SetPasswordForm from "./data/setPasswordForm";

const ajv = new Ajv({
    allErrors: true,
    strict: true,
});
const setPasswordForm = new SetPasswordForm();
const setPasswordFormValidationSchema = setPasswordForm.getValidationSchema();
const setPasswordFormValidation = ajv.compile(setPasswordFormValidationSchema);

export default () => ({
    async handler(req, rep) {
        try {
            const validationResult = setPasswordFormValidation(req.body);
            if (!validationResult) {
                return rep.error({
                    form: setPasswordFormValidation.errors,
                });
            }
            const {
                id,
            } = req.body;
            if (!id || typeof id !== "string" || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)) {
                return rep.error({
                    message: "invalidId",
                });
            }
            const formData = req.body.formTabs._default;
            const captcha = new Captcha(this);
            const [code, imageSecret] = formData.captcha.split(/_/);
            const captchaValidationResult = await captcha.verifyCaptcha(imageSecret, code);
            if (!captchaValidationResult) {
                return rep.error({
                    form: [{
                        instancePath: "captcha",
                        keyword: "invalidCaptcha",
                        tab: "_default",
                    }],
                });
            }
            const activationDb = await this.mongo.db.collection(this.systemConfig.collections.activation).findOne({
                _id: id,
            });
            if (!activationDb) {
                return rep.error({
                    message: "Invalid ID",
                });
            }
            const password = new Password(this.systemConfig.passwordPolicy);
            const check = password.checkPolicy(formData.password);
            if (check.errors.length) {
                return rep.error({
                    form: [{
                        instancePath: "password",
                        keyword: "invalidPassword",
                        tab: "_default",
                    }],
                    policyErrors: check.errors,
                });
            }
            const newPasswordHash = await req.auth.createHash(`${formData.password}${this.systemConfig.secret}`);
            if (!this.systemConfig.demo) {
                await this.mongo.db.collection(this.systemConfig.collections.users).updateOne({
                    _id: activationDb.userId,
                }, {
                    $set: {
                        password: newPasswordHash,
                    },
                });
            }
            await this.mongo.db.collection(this.systemConfig.collections.activation).deleteOne({
                _id: id,
            });
            return rep.success({});
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
