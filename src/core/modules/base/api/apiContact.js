import Ajv from "ajv";
import ContactForm from "#core/components/hcontact/form.js";
import Captcha from "#lib/captcha";
import Email from "#lib/email";
import emailContact from "../email/emailContact.marko";

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
            if (!this.systemConfig.email.enabled || !this.systemConfig.email.admin) {
                return rep.success({});
            }
            const email = formData.email.toLowerCase();
            try {
                const {
                    language,
                } = req.body;
                const languageData = {
                    ...this.languageData,
                };
                languageData[language] = {
                    ...languageData[language],
                    ...(await import(`../translations/${language}.json`)).default,
                };
                const t = (id, d = {}) => languageData[language] && typeof languageData[language][id] === "function" ? languageData[language][id](d) : languageData[language] ? languageData[language][id] : id;
                const input = {
                    t,
                    name: formData.name,
                    email,
                    message: formData.message,
                };
                const renderPage = await emailContact.render(input);
                const renderText = (await import("../email/emailContact.js")).default(input);
                const emailEngine = new Email(this);
                await emailEngine.send(this.systemConfig.email.admin, t("contactSubject"), renderPage.toString(), renderText);
            } catch {
                //
            }
            return rep.success({});
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
