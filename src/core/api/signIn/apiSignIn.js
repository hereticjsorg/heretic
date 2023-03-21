import SignInForm from "../../../../site/pages/signIn/data/signInForm";
import FormValidator from "../../lib/formValidatorServer";

export default () => ({
    async handler(req, rep) {
        try {
            const signInForm = new SignInForm();
            const formValidator = new FormValidator(signInForm.getValidationSchema(), signInForm.getFieldsFlat(), this);
            const multipartData = await req.processMultipart();
            const {
                data
            } = formValidator.parseMultipartData(multipartData);
            const validationResult = formValidator.validate();
            if (validationResult) {
                return rep.error({
                    form: validationResult,
                });
            }
            const userDb = await req.auth.authorize(data._default.username, data._default.password);
            if (!userDb) {
                await req.addEvent("loginFail", {}, {
                    username: data._default.username,
                    password: data._default.password,
                });
                return rep.error({
                    message: "error_invalid_credentials"
                }, 403);
            }
            const token = req.auth.generateToken(String(userDb._id), userDb.sid);
            await req.addEvent("loginSuccess", userDb);
            return rep.success({
                token,
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
