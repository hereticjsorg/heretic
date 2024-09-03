import FormData from "../data/form";
import moduleConfig from "../module.js";

export default () => ({
    async handler(req, rep) {
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (!authData) {
                return rep.error({}, 403);
            }
            const formData = new FormData();
            const options = req.validateRecycleBinList();
            if (!options) {
                return rep.error({
                    message: "validation_error",
                });
            }
            const recycleBinConfig = formData.getRecycleBinConfig();
            options.projection = {
                _id: 1,
            };
            options.projection[recycleBinConfig.title] = 1;
            if (recycleBinConfig.id) {
                options.projection[recycleBinConfig.id] = 1;
            }
            const query = {
                deleted: {
                    $exists: true,
                },
            };
            const total = await this.mongo.db
                .collection(moduleConfig.collections.main)
                .countDocuments(query);
            const items = await this.mongo.db
                .collection(moduleConfig.collections.main)
                .find(query, options)
                .toArray();
            return rep.code(200).send({
                items: req.processDataList(items, formData.getFieldsFlat()),
                total,
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    },
});
