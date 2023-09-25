import fs from "fs-extra";
import FormData from "../data/loadFile";
import FormValidator from "#lib/formValidatorServer";
import moduleConfig from "../module.js";
import Utils from "./utils";

const utils = new Utils();

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
            const requestData = data._default;
            const filePath = utils.getPath(`${requestData.dir}/${requestData.filename}`);
            if (!utils.fileExists(filePath)) {
                return rep.error({
                    message: "File not found",
                });
            }
            const stats = await fs.lstat(filePath);
            if (!stats.isFile() || utils.isBinary(requestData.filename) || stats.size > moduleConfig.maxFileEditSizeBytes) {
                return rep.error({
                    message: "Not a file or is not editable",
                });
            }
            const content = await fs.readFile(filePath, "utf8");
            return rep.code(200).send({
                content,
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
