import Ajv from "ajv";
import {
    v4 as uuid,
} from "uuid";
import EmailForm from "./data/emailForm";
import Email from "../../lib/email";
import Utils from "../../lib/componentUtils";
import emailChangeNotificationTemplate from "./email/emailChangeNotification.marko";

const ajv = new Ajv({
    allErrors: true,
    strict: true,
});
const emailForm = new EmailForm();
const emailFormValidationSchema = emailForm.getValidationSchema();
const emailFormValidation = ajv.compile(emailFormValidationSchema);

export default () => ({
    async handler(req, rep) {
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (!authData) {
                return rep.error({
                    message: "Access Denied",
                }, 403);
            }
            const validationResult = emailFormValidation(req.body);
            if (!validationResult) {
                return rep.error({
                    form: emailFormValidation.errors,
                });
            }
            const userDb = await this.mongo.db.collection(this.systemConfig.collections.users).findOne({
                _id: authData._id,
            });
            if (!await req.auth.verifyHash(`${req.body.passwordCurrent}${this.systemConfig.secret}`, userDb.password)) {
                return rep.error({
                    message: "Access Denied",
                    errors: [{
                        instancePath: "passwordCurrent",
                        keyword: "invalidPassword",
                        tab: "_default",
                    }],
                }, 403);
            }
            const uid = uuid();
            await this.mongo.db.collection(this.systemConfig.collections.activation).insertOne({
                _id: uid,
                type: "email",
                userId: String(authData._id),
                value: req.body.email.toLowerCase(),
            });
            const {
                language,
            } = req.body;
            const utils = new Utils(null, language);
            const languageData = {
                ...this.languageData,
            };
            languageData[language] = {
                ...languageData[language],
                ...(await import(`./translations/${language}.json`)).default,
            };
            // eslint-disable-next-line no-console
            console.log(this.siteConfig.url);
            const input = {
                t: id => languageData[language] && languageData[language][id] ? languageData[language][id] : id,
                activationUrl: utils.getLocalizedURL(`${this.siteConfig.url}/activate?id=${uid}`),
            };
            // eslint-disable-next-line no-console
            console.log(input);
            const renderPage = await emailChangeNotificationTemplate.render(input);
            const renderText = (await import("./email/emailChangeNotification.js")).default(input);
            const email = new Email(this);
            await email.send("xtreme@rh1.ru", "Test message", renderPage.toString(), renderText);
            return rep.success({});
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
