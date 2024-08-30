import Ajv from "ajv";
import { v4 as uuid } from "uuid";
import EmailForm from "../data/emailForm";
import Email from "#lib/email";
import Utils from "#lib/componentUtils";

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
            const emailChangeNotificationTemplate = (
                await import(
                    /* webpackIgnore: true */ "../email/emailChangeNotification.marko"
                )
            ).default;
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (!authData) {
                return rep.error(
                    {
                        message: "Access Denied",
                    },
                    403,
                );
            }
            const validationResult = emailFormValidation(req.body);
            if (!validationResult) {
                return rep.error({
                    form: emailFormValidation.errors,
                });
            }
            const userDb = await this.mongo.db
                .collection(this.systemConfig.collections.users)
                .findOne({
                    _id: authData._id,
                });
            if (
                !(await req.auth.verifyHash(
                    `${req.body.passwordCurrent}${this.systemConfig.secret}`,
                    userDb.password,
                ))
            ) {
                return rep.error(
                    {
                        form: [
                            {
                                instancePath: "passwordCurrent",
                                keyword: "invalidPassword",
                                tab: "_default",
                            },
                        ],
                    },
                    403,
                );
            }
            const value = req.body.email.toLowerCase();
            if (userDb.email === value) {
                return rep.error({
                    form: [
                        {
                            instancePath: "email",
                            keyword: "emailNotChanged",
                            tab: "_default",
                        },
                    ],
                });
            }
            if (!this.systemConfig.demo) {
                const uid = uuid();
                await this.mongo.db
                    .collection(this.systemConfig.collections.activation)
                    .insertOne({
                        _id: uid,
                        type: "email",
                        userId: String(authData._id),
                        value,
                    });
                const { language } = req.body;
                const utils = new Utils(null, language);
                const languageData = {
                    ...this.languageData,
                };
                languageData[language] = {
                    ...languageData[language],
                    ...(await import(`../translations/${language}.json`))
                        .default,
                };
                const t = (id, d = {}) =>
                    languageData[language] &&
                    typeof languageData[language][id] === "function"
                        ? languageData[language][id](d)
                        : languageData[language]
                          ? languageData[language][id]
                          : id;
                const input = {
                    t,
                    activationUrl: utils.getLocalizedFullURL(
                        `${this.siteConfig.url}/activate?id=${uid}`,
                    ),
                };
                const renderPage =
                    await emailChangeNotificationTemplate.render(input);
                const renderText = (
                    await import("../email/emailChangeNotification.js")
                ).default(input);
                const email = new Email(this);
                await email.send(
                    value,
                    t("changeEmail"),
                    renderPage.toString(),
                    renderText,
                );
            }
            return rep.success({});
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    },
});
