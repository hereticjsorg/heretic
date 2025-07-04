import { Totp } from "time2fa";
import SignInForm from "../data/signInFormAdmin.js";
import FormValidator from "#lib/formValidatorServer.js";

export default () => ({
    async handler(req, rep) {
        try {
            const signInForm = new SignInForm();
            const formValidator = new FormValidator(
                signInForm.getValidationSchema(),
                signInForm.getFieldsFlat(),
                this,
            );
            let multipartData;
            try {
                multipartData = await req.processMultipart();
            } catch (e) {
                await req.removeMultipartTempFiles();
                return rep.error({
                    message: e.message,
                });
            }
            const { data } = formValidator.parseMultipartData(multipartData);
            const validationResult = formValidator.validate();
            if (validationResult) {
                return rep.error({
                    form: validationResult,
                });
            }
            let userDb;
            if (data._default.token) {
                let tokenData;
                try {
                    tokenData = this.jwt.verify(data._default.token);
                } catch {
                    return rep.error(
                        {
                            message: "error_invalid_token",
                        },
                        403,
                    );
                }
                userDb = await req.auth.authorize(null, null, tokenData.uid);
            } else {
                userDb = await req.auth.authorize(
                    data._default.username,
                    data._default.password,
                );
            }
            if (!userDb) {
                await req.addEvent(
                    "loginFail",
                    {},
                    {
                        username: data._default.username,
                        password: data._default.password,
                    },
                );
                return rep.error(
                    {
                        message: "error_invalid_credentials",
                    },
                    403,
                );
            }
            if (userDb.tfaConfig) {
                if (!data._default.code) {
                    return rep.success({
                        token: null,
                        needCode: true,
                    });
                }
                if (
                    !Totp.validate({
                        passcode: data._default.code,
                        secret: userDb.tfaConfig.secret,
                    })
                ) {
                    return rep.error({
                        reason: 2,
                    });
                }
            }
            const token = req.auth.generateToken(
                String(userDb._id),
                userDb.sid,
            );
            await req.addEvent("loginSuccess", userDb);
            return rep.success({
                token,
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    },
});
