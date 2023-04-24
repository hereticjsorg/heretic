import Ajv from "ajv";
import Password from "../../lib/password";
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
            const username = formData.username.toLowerCase();
            const email = formData.email.toLowerCase();
            const userDb = await this.mongo.db.collection(this.systemConfig.collections.users).find({
                $or: [{
                        username
                    },
                    {
                        email
                    },
                ]
            }).toArray();
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
                    form: [{
                        instancePath: "password",
                        keyword: "invalidPassword",
                        tab: "_default",
                    }],
                    policyErrors: check.errors,
                });
            }
            return rep.success({});
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
