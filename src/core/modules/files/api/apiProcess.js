import FormData from "../data/process";
import FormValidator from "#lib/formValidatorServer";
// import moduleConfig from "../module.js";
// import utils from "./utils";

export default () => ({
    async handler(req, rep) {
        const formData = new FormData();
        const formValidator = new FormValidator(formData.getValidationSchema(), formData.getFieldsFlat(), this);
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (!authData) {
                return rep.error({}, 403);
            }
            const multipartData = await req.processMultipart();
            const {
                data,
            } = formValidator.parseMultipartData(multipartData);
            const validationResult = formValidator.validate();
            if (validationResult) {
                return rep.error({
                    form: validationResult,
                });
            }
            // eslint-disable-next-line no-console
            console.log(data);
            return rep.code(200).send({});
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
