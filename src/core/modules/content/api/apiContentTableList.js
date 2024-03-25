import FormData from "../data/contentForm";
import moduleConfig from "../module.js";
import languages from "#etc/languages.json";

export default () => ({
    async handler(req, rep) {
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (!authData || !authData.groupData || !authData.groupData.find(i => i.id === "admin" && i.value === true)) {
                return rep.error({
                    message: "Access Denied",
                }, 403);
            }
            const formData = new FormData();
            const options = req.validateTableList(formData);
            if (!options) {
                return rep.error({
                    message: "validation_error"
                });
            }
            const query = req.generateQuery(formData);
            const grandTotal = await this.mongo.db.collection(moduleConfig.collections.content).countDocuments({
                deleted: {
                    $exists: false,
                },
            });
            const total = await this.mongo.db.collection(moduleConfig.collections.content).countDocuments(query);
            const languagesList = Object.keys(languages);
            const items = (await this.mongo.db.collection(moduleConfig.collections.content).find(query, options).toArray()).map(i => {
                i.title = i[req.body.language] ? i[req.body.language].title || null : null;
                if (!i.title) {
                    for (const lang of languagesList) {
                        i.title = i.title ? i.title : (i[lang] ? i[lang].title : null);
                    }
                }
                return i;
            });
            return rep.code(200).send({
                items: req.processDataList(items, formData.getFieldsFlat()),
                total,
                grandTotal,
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
