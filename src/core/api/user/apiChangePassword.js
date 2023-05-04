import Ajv from "ajv";
import Password from "../../lib/password";
import PasswordForm from "./data/passwordForm";

const ajv = new Ajv({
    allErrors: true,
    strict: true,
});
const passwordForm = new PasswordForm();
const passwordFormValidationSchema = passwordForm.getValidationSchema();
const passwordFormValidation = ajv.compile(passwordFormValidationSchema);

export default () => ({
    async handler(req, rep) {
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (!authData) {
                return rep.error({
                    message: "Access Denied",
                }, 403);
            }
            const validationResult = passwordFormValidation(req.body);
            if (!validationResult) {
                return rep.error({
                    form: passwordFormValidation.errors,
                });
            }
            const userDb = await this.mongo.db.collection(this.systemConfig.collections.users).findOne({
                _id: authData._id,
            });
            if (!await req.auth.verifyHash(`${req.body.passwordCurrent}${this.systemConfig.secret}`, userDb.password)) {
                return rep.error({
                    form: [{
                        instancePath: "passwordCurrent",
                        keyword: "invalidPassword",
                        tab: "_default",
                    }],
                }, 403);
            }
            if (req.body.passwordCurrent.trim() === req.body.password.trim()) {
                return rep.error({
                    form: [{
                        instancePath: "password",
                        keyword: "passwordNotChanged",
                        tab: "_default",
                    }],
                });
            }
            const password = new Password(this.systemConfig.passwordPolicy);
            const check = password.checkPolicy(req.body.password);
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
            if (!this.systemConfig.demo) {
                const newPasswordHash = await req.auth.createHash(`${req.body.password}${this.systemConfig.secret}`);
                await this.mongo.db.collection(this.systemConfig.collections.users).updateOne({
                    _id: authData._id,
                }, {
                    $set: {
                        password: newPasswordHash,
                    },
                });
                await this.mongo.db.collection(this.systemConfig.collections.sessions).deleteOne({
                    _id: authData.session._id,
                });
            }
            return rep.success({
                sessionData: authData.session,
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
