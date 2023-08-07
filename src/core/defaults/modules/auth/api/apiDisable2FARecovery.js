import Ajv from "ajv";
import RecoveryForm from "../data/recoveryForm.js";

const ajv = new Ajv({
    allErrors: true,
    strict: true,
});
const recoveryForm = new RecoveryForm();
const recoveryFormValidationSchema = recoveryForm.getValidationSchema();
const recoveryFormValidation = ajv.compile(recoveryFormValidationSchema);

export default () => ({
    async handler(req, rep) {
        const authData = await req.auth.getData(req.auth.methods.COOKIE);
        const validationResult = recoveryFormValidation(req.body);
        if (!validationResult) {
            return rep.error({
                form: recoveryFormValidation.errors,
            });
        }
        let userDb;
        if (!authData) {
            userDb = req.body.username && req.body.password ? await req.auth.authorize(req.body.username, req.body.password) : null;
            if (!userDb) {
                await req.addEvent("loginFail", {}, {
                    username: req.body.username,
                    password: req.body.password,
                });
                return rep.error({
                    message: "error_invalid_credentials"
                }, 403);
            }
        } else {
            userDb = await this.mongo.db.collection(this.systemConfig.collections.users).findOne({
                _id: authData._id,
            });
        }
        if (!userDb.tfaConfig) {
            return rep.error({
                reason: 1,
            });
        }
        if (!await req.auth.verifyHash(req.body.recoveryCode.toUpperCase(), userDb.tfaConfig.recoveryCode)) {
            return rep.error({
                reason: 2,
            });
        }
        await this.mongo.db.collection(this.systemConfig.collections.users).updateOne({
            _id: userDb._id,
        }, {
            $unset: {
                tfaConfig: null,
            },
        });
        return rep.success({});
    }
});
