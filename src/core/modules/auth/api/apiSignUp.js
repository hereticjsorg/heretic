import Ajv from "ajv";
import { v4 as uuid } from "uuid";
import Password from "#lib/password";
import SignUpForm from "../data/signUpForm";
import Captcha from "#lib/captcha";
import Email from "#lib/email";
import Utils from "#lib/componentUtils";
import languagesData from "#etc/languages.json";

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
            const emailChangeNotificationTemplate = (
                await import(
                    /* webpackIgnore: true */ "../email/signUpNotification.marko"
                )
            ).default;
            const validationResult = signUpFormValidation(req.body);
            if (!validationResult) {
                return rep.error({
                    form: signUpFormValidation.errors,
                });
            }
            const formData = req.body.formTabs._default;
            const captcha = new Captcha(this);
            const [code, imageSecret] = formData.captcha.split(/_/);
            const captchaValidationResult = await captcha.verifyCaptcha(
                imageSecret,
                code,
            );
            if (!captchaValidationResult) {
                return rep.error({
                    form: [
                        {
                            instancePath: "captcha",
                            keyword: "invalidCaptcha",
                            tab: "_default",
                        },
                    ],
                });
            }
            const username = formData.username.toLowerCase();
            const email = formData.email.toLowerCase();
            const userDb = await this.mongo.db
                .collection(this.systemConfig.collections.users)
                .find({
                    $or: [
                        {
                            username,
                        },
                        {
                            email,
                        },
                    ],
                })
                .toArray();
            if (userDb) {
                const form = [];
                const duplicates = {};
                for (const user of userDb) {
                    if (user.username === username && !duplicates["username"]) {
                        duplicates["username"] = 1;
                        form.push({
                            instancePath: "username",
                            keyword: "duplicateUsername",
                            tab: "_default",
                        });
                    }
                    if (user.email === email && !duplicates["email"]) {
                        duplicates["email"] = 1;
                        form.push({
                            instancePath: "email",
                            keyword: "duplicateEmail",
                            tab: "_default",
                        });
                    }
                }
                if (form.length) {
                    return rep.error({
                        form,
                    });
                }
            }
            const password = new Password(this.systemConfig.passwordPolicy);
            const check = password.checkPolicy(formData.password);
            if (check.errors.length) {
                return rep.error({
                    message: "passwordPolicyViolation",
                    form: [
                        {
                            instancePath: "password",
                            keyword: "invalidPassword",
                            tab: "_default",
                        },
                    ],
                    policyErrors: check.errors,
                });
            }
            if (!this.systemConfig.demo) {
                const passwordHash = await req.auth.createHash(
                    `${formData.password}${this.systemConfig.secret}`,
                );
                const insertResult = await this.mongo.db
                    .collection(this.systemConfig.collections.users)
                    .insertOne({
                        username,
                        email,
                        password: passwordHash,
                        groups: null,
                        displayName: null,
                        active: false,
                        signUpAt: new Date(),
                    });
                const { insertedId } = insertResult;
                const uid = uuid();
                await this.mongo.db
                    .collection(this.systemConfig.collections.activation)
                    .insertOne({
                        _id: uid,
                        type: "user",
                        userId: String(insertedId),
                    });
                let { language } = req.body;
                if (
                    !language ||
                    typeof language !== "string" ||
                    !Object.keys(languagesData).find((i) => language === i)
                ) {
                    [language] = Object.keys(languagesData);
                }
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
                    await import("../email/signUpNotification.js")
                ).default(input);
                const em = new Email(this);
                await em.send(
                    email,
                    t("signUp"),
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
