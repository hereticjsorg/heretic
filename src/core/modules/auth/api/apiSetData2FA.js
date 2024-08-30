import Ajv from "ajv";
import { Totp } from "time2fa";
import { v4 as uuid } from "uuid";
import Save2FaForm from "../data/save2FaForm.js";

const ajv = new Ajv({
    allErrors: true,
    strict: true,
});
const save2FaForm = new Save2FaForm();
const save2FaFormValidationSchema = save2FaForm.getValidationSchema();
const save2FaFormValidation = ajv.compile(save2FaFormValidationSchema);

export default () => ({
    async handler(req, rep) {
        const authData = await req.auth.getData(req.auth.methods.COOKIE);
        if (!authData) {
            return rep.error(
                {
                    message: "Access Denied",
                },
                403,
            );
        }
        const validationResult = save2FaFormValidation(req.body);
        if (!validationResult) {
            return rep.error({
                form: save2FaFormValidation.errors,
            });
        }
        const userDb = await this.mongo.db
            .collection(this.systemConfig.collections.users)
            .findOne({
                _id: authData._id,
            });
        if (userDb.config2Fa) {
            return rep.error({
                reason: 1,
            });
        }
        if (
            !Totp.validate({
                passcode: req.body.code,
                secret: req.body.secret,
            })
        ) {
            return rep.error({
                reason: 2,
            });
        }
        const recoveryCode = uuid().toUpperCase();
        if (!this.systemConfig.demo) {
            await this.mongo.db
                .collection(this.systemConfig.collections.users)
                .updateOne(
                    {
                        _id: authData._id,
                    },
                    {
                        $set: {
                            tfaConfig: {
                                secret: req.body.secret,
                                recoveryCode:
                                    await req.auth.createHash(recoveryCode),
                            },
                        },
                    },
                );
        }
        return rep.success({
            recoveryCode,
        });
    },
});
