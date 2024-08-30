import { ObjectId } from "mongodb";
import FormData from "../data/usersForm";
import moduleConfig from "../module.js";

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
            if (!req.validateDataLoad()) {
                return rep.error({
                    message: "validation_error",
                });
            }
            const formData = new FormData();
            const item = await this.mongo.db
                .collection(moduleConfig.collections.users)
                .findOne({
                    _id: new ObjectId(req.body.id),
                });
            const data = req.processFormData(
                {
                    _default: item,
                    tfa: !!item.tfaConfig,
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
