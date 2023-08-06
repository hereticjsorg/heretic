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
        if (!authData) {
            return rep.error({
                message: "Access Denied",
            }, 403);
        }
        const validationResult = recoveryFormValidation(req.body);
        if (!validationResult) {
            return rep.error({
                form: recoveryFormValidation.errors,
            });
        }
        const userDb = await this.mongo.db.collection(this.systemConfig.collections.users).findOne({
            _id: authData._id,
        });
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
            _id: authData._id,
        }, {
            $unset: {
                tfaConfig: null,
            },
        });
        return rep.success({});
    }
});
