import Ajv from "ajv";
import {
    v4 as uuid,
} from "uuid";
import RestorePasswordForm from "./data/restorePasswordForm";
import Captcha from "../../lib/captcha";
import Email from "../../lib/email";
import Utils from "../../lib/componentUtils";
import restorePasswordNotificationTemplate from "./email/restorePasswordNotification.marko";
import languagesData from "../../../../etc/languages.json";

const ajv = new Ajv({
    allErrors: true,
    strict: true,
});
const restorePasswordForm = new RestorePasswordForm();
const restorePasswordFormValidationSchema = restorePasswordForm.getValidationSchema();
const restorePasswordFormValidation = ajv.compile(restorePasswordFormValidationSchema);

export default () => ({
    async handler(req, rep) {
        try {
            const validationResult = restorePasswordFormValidation(req.body);
            if (!validationResult) {
                return rep.error({
                    form: restorePasswordFormValidation.errors,
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
            const email = formData.email.toLowerCase();
            const userDb = await this.mongo.db.collection(this.systemConfig.collections.users).findOne({
                email,
            });
            if (!userDb) {
                return rep.success({});
            }
            const uid = uuid();
            await this.mongo.db.collection(this.systemConfig.collections.activation).insertOne({
                _id: uid,
                type: "password",
                userId: String(userDb._id),
            });
            let {
                language,
            } = req.body;
            if (!language || typeof language !== "string" || !Object.keys(languagesData).find(i => language === i)) {
                [language] = Object.keys(languagesData);
            }
            const utils = new Utils(null, language);
            const languageData = {
                ...this.languageData,
            };
            languageData[language] = {
                ...languageData[language],
                ...(await import(`./translations/${language}.json`)).default,
            };
            const t = (id, d = {}) => languageData[language] && typeof languageData[language][id] === "function" ? languageData[language][id](d) : languageData[language] ? languageData[language][id] : id;
            const input = {
                t,
                activationUrl: utils.getLocalizedFullURL(`${this.siteConfig.url}/activate?id=${uid}`),
            };
            const renderPage = await restorePasswordNotificationTemplate.render(input);
            const renderText = (await import("./email/restorePasswordNotification.js")).default(input);
            const em = new Email(this);
            if (!this.systemConfig.demo) {
                await em.send(email, t("restorePassword"), renderPage.toString(), renderText);
            }
            return rep.success({});
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
