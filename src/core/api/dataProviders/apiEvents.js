import Ajv from "ajv";
import dataProvidersSchema from "./dataProvidersSchema";

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
            const data = {};
            for (const p of Object.keys(this.dataProviders)) {
                const dataProvider = this.dataProviders[p];
                if (dataProvider.getEvents) {
                    dataProvider.setTranslations(id => this.languageData[req.query.language][id] || id);
                    const eventsData = dataProvider.getEvents();
                    if (eventsData) {
                        for (const event of eventsData) {
                            data[event.id] = event.title;
                        }
                    }
                }
            }
            return rep.success({
                data,
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});