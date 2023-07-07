import Ajv from "ajv";
import dataProvidersSchema from "../data/dataProvidersSchema";

const ajv = new Ajv({
    allErrors: true,
    strict: false,
});

export default () => ({
    async handler(req, rep) {
        const authData = await req.auth.getData(req.auth.methods.HEADERS);
        if (!authData || !authData.groupData || !authData.groupData.find(i => i.id === "admin" && i.value === true)) {
            return rep.error({
                message: "Access Denied",
            }, 403);
        }
        const dataProvidersValidator = ajv.compile(dataProvidersSchema);
        try {
            const validationResult = !!dataProvidersValidator(req.query);
            if (!validationResult) {
                return rep.error({
                    message: "Validation error",
                    data: dataProvidersValidator.errors,
                });
            }
            const data = [];
            for (const p of Object.keys(this.dataProviders)) {
                const dataProvider = this.dataProviders[p];
                if (dataProvider.getGroupsData) {
                    dataProvider.setTranslations((id, d = {}) => typeof this.languageData[req.query.language][id] === "function" ? this.languageData[req.query.language][id](d) : this.languageData[req.query.language][id] || id);
                    const groupsData = dataProvider.getGroupsData();
                    if (groupsData) {
                        for (const group of groupsData) {
                            if (group.type === "database") {
                                const records = await this.mongo.db.collection(group.collection).find({}, {
                                    limit: 100,
                                }).toArray();
                                group.items = records.map(r => ({
                                    id: String(r._id),
                                    label: r[group.field] || "—",
                                }));
                            }
                            data.push(group);
                        }
                    }
                }
            }
            return rep.success({
                data
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
