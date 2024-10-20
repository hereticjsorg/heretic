import Ajv from "ajv";
import FormData from "../data/form.js";
import moduleConfig from "../module.js";
import loadValidationSchema from "../data/loadValidationSchema.json";

const ajv = new Ajv({
    allErrors: true,
    strict: true,
});
const loadSchema = ajv.compile(loadValidationSchema);

export default () => ({
    async handler(req, rep) {
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (
                !authData ||
                !authData.groupData ||
                !authData.groupData.find(
                    (i) => i.id === "admin" && i.value === true,
                )
            ) {
                return rep.error(
                    {
                        message: "Access Denied",
                    },
                    403,
                );
            }
            if (!loadSchema(req.body)) {
                return rep.error({
                    message: "validation_error",
                });
            }
            const formData = new FormData();
            const item = await this.mongo.db
                .collection(moduleConfig.collections.sessions)
                .findOne({
                    _id: req.body.id,
                });
            const data = req.processFormData(
                {
                    _default: item,
                },
                formData.getFieldsFlat(),
                [
                    {
                        id: "_default",
                    },
                ],
            );
            delete data._default.password;
            return rep.code(200).send(data);
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    },
});
