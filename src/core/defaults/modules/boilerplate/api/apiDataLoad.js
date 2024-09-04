import { ObjectId } from "mongodb";
import FormData from "../data/form.js";
import moduleConfig from "../module.js";
import utils from "./utils.js";

export default () => ({
    async handler(req, rep) {
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (!authData) {
                return rep.error({}, 403);
            }
            if (!req.validateDataLoad()) {
                return rep.error({
                    message: "validation_error",
                });
            }
            const formData = new FormData();
            const query = utils.filter(
                {
                    _id: new ObjectId(req.body.id),
                },
                authData,
            );
            const options = {
                projection: {},
            };
            const restrictedFields = formData.getRestrictedFields
                ? formData.getRestrictedFields()
                : [];
            const restrictedAreas = formData.getRestrictedAreas
                ? formData.getRestrictedAreas()
                : [];
            const { access, areas } = utils.getAccessData(
                restrictedFields,
                restrictedAreas,
                formData.getFieldsArea ? formData.getFieldsArea() : {},
                authData,
                options,
            );
            const item = await this.mongo.db
                .collection(moduleConfig.collections.main)
                .findOne(query, options);
            if (!item) {
                return rep.error({}, 404);
            }
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
            data._access = access;
            data._areas = areas;
            return rep.code(200).send(data);
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    },
});
