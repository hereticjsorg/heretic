import Ajv from "ajv";
import { Totp } from "time2fa";
import { ObjectId } from "mongodb";
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
        const validationResult = otpFormValidation(req.body);
        if (!validationResult) {
            return rep.error({
                form: otpFormValidation.errors,
            });
        }
        let userDb;
        if (req.body.token) {
            let tokenData;
            try {
                tokenData = this.jwt.verify(req.body.token);
            } catch {
                return rep.error(
                    {
                        message: "error_invalid_token",
                    },
                    403,
                );
            }
            userDb = await this.mongo.db
                .collection(this.systemConfig.collections.users)
                .findOne({
                    _id: new ObjectId(tokenData.uid),
                });
        } else if (!authData) {
            userDb =
                req.body.username && req.body.password
                    ? await req.auth.authorize(
                          req.body.username,
                          req.body.password,
                      )
                    : null;
            if (!userDb) {
                await req.addEvent(
                    "loginFail",
                    {},
                    {
                        username: req.body.username,
                        password: req.body.password,
                    },
                );
                return rep.error(
                    {
                        message: "error_invalid_credentials",
                    },
                    403,
                );
            }
        } else {
            userDb = await this.mongo.db
                .collection(this.systemConfig.collections.users)
                .findOne({
                    _id: authData._id,
                });
        }
        if (!userDb.tfaConfig) {
            return rep.error({
                reason: 1,
            });
        }
        if (
            !Totp.validate({
                passcode: req.body.code,
                secret: userDb.tfaConfig.secret,
            })
        ) {
            return rep.error({
                reason: 2,
            });
        }
        return rep.success({});
    },
});
