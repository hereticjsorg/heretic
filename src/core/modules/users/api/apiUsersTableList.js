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
            const formData = new FormData();
            const options = req.validateTableList(formData);
            if (!options) {
                return rep.error({
                    message: "validation_error",
                });
            }
            const query = req.generateQuery(formData);
            const grandTotal = await this.mongo.db
                .collection(moduleConfig.collections.users)
                .countDocuments({
                    deleted: {
                        $exists: false,
                    },
                });
            const total = await this.mongo.db
                .collection(moduleConfig.collections.users)
                .countDocuments(query);
            const items = await this.mongo.db
                .collection(moduleConfig.collections.users)
                .find(query, options)
                .toArray();
            return rep.code(200).send({
                items: req.processDataList(items, formData.getFieldsFlat()),
                total,
                grandTotal,
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    },
});
