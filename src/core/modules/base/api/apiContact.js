import Ajv from "ajv";
// import {
//     v4 as uuid,
// } from "uuid";
import ContactForm from "#core/components/hcontact/form.js";
import Captcha from "#lib/captcha";
// import Email from "#lib/email";
// import Utils from "#lib/componentUtils";

const ajv = new Ajv({
    allErrors: true,
    strict: true,
});
const contactForm = new ContactForm();
const contactFormValidationSchema = contactForm.getValidationSchema();
const contactFormValidation = ajv.compile(contactFormValidationSchema);

export default () => ({
    async handler(req, rep) {
        try {
            const validationResult = contactFormValidation(req.body);
            if (!validationResult) {
                return rep.error({
                    form: contactFormValidation.errors,
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
            // const email = formData.email.toLowerCase();
            // eslint-disable-next-line no-console
            console.log(formData);
            if (!this.systemConfig.email.enabled) {
                return rep.success({});
            }
            return rep.success({});
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
