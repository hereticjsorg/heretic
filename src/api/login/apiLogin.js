import LoginForm from "../../core/modules/_login/admin/login-form-admin/loginForm";
import FormValidator from "../../core/formValidatorServer";

export default () => ({
    async handler(req, rep) {
        try {
            const loginForm = new LoginForm();
            const formValidator = new FormValidator(loginForm.getValidationSchema(), loginForm.getFieldsFlat());
            formValidator.parseMultipartData(await req.processMultipart());
            const validationResult = formValidator.validate();
            if (validationResult) {
                return rep.error({
                    form: validationResult
                });
            }
            return rep.success();
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
