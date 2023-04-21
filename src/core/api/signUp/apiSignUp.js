import Ajv from "ajv";
import SignUpForm from "./data/signUpForm";
import Captcha from "../../lib/captcha";

const ajv = new Ajv({
    allErrors: true,
    strict: true,
});
const signUpForm = new SignUpForm();
const signUpFormValidationSchema = signUpForm.getValidationSchema();
const signUpFormValidation = ajv.compile(signUpFormValidationSchema);

export default () => ({
    async handler(req, rep) {
        try {
            const validationResult = signUpFormValidation(req.body);
            if (!validationResult) {
                return rep.error({
                    form: signUpFormValidation.errors,
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
            return rep.success({});
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
