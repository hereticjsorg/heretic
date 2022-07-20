import LoginForm from "../../modules/_login/admin/login-form-admin/loginForm";
import FormValidator from "../../lib/formValidatorServer";

export default () => ({
    async handler(req, rep) {
        try {
            const loginForm = new LoginForm();
            const formValidator = new FormValidator(loginForm.getValidationSchema(), loginForm.getFieldsFlat());
            const multipartData = await req.processMultipart();
            const data = formValidator.parseMultipartData(multipartData);
            const validationResult = formValidator.validate();
            if (validationResult) {
                return rep.error({
                    form: validationResult
                });
            }
            const userDb = await req.auth.authorize(data._default.username, data._default.password);
            if (!userDb) {
                return rep.error({
                    message: "error_invalid_credentials"
                }, 403);
            }
            const token = req.auth.generateToken(userDb);
            return rep.success({
                token,
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
