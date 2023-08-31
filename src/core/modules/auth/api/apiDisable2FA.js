import Ajv from "ajv";
import {
    Totp,
} from "time2fa";
import OtpForm from "../data/otpForm.js";

const ajv = new Ajv({
    allErrors: true,
    strict: true,
});
const otpForm = new OtpForm();
const otpFormValidationSchema = otpForm.getValidationSchema();
const otpFormValidation = ajv.compile(otpFormValidationSchema);

export default () => ({
    async handler(req, rep) {
        const authData = await req.auth.getData(req.auth.methods.COOKIE);
        if (!authData) {
            return rep.error({
                message: "Access Denied",
            }, 403);
        }
        const validationResult = otpFormValidation(req.body);
        if (!validationResult) {
            return rep.error({
                form: otpFormValidation.errors,
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
        if (!Totp.validate({
                passcode: req.body.code,
                secret: userDb.tfaConfig.secret,
            })) {
            return rep.error({
                reason: 2,
            });
        }
        if (!this.systemConfig.demo) {
            await this.mongo.db.collection(this.systemConfig.collections.users).updateOne({
                _id: authData._id,
            }, {
                $unset: {
                    tfaConfig: null,
                },
            });
        }
        return rep.success({});
    }
});
