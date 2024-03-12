import {
    ObjectId
} from "mongodb";
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
            if (!req.validateDataLoad()) {
                return rep.error({
                    message: "validation_error",
                });
            }
            const item = await this.mongo.db.collection(moduleConfig.collections.content).findOne({
                _id: new ObjectId(req.body.id),
            });
            if (!item) {
                return rep.error({
                    message: "Not Found",
                }, 404);
            }
            const languagesList = Object.keys(languages);
            for (const k of Object.keys(item)) {
                if (languagesList.indexOf(k) < 0) {
                    for (const lang of languagesList) {
                        if (item[lang]) {
                            item[lang][k] = item[k];
                        }
                    }
                    delete item[k];
                }
            }
            const content = {};
            let id;
            let title;
            for (const lang of languagesList) {
                if (item[lang]) {
                    if (item[lang].content) {
                        content[lang] = item[lang].content;
                        delete item[lang].content;
                    }
                    id = item[lang]._id;
                    delete item[lang]._id;
                    if (!title) {
                        title = item[lang].title;
                    }
                }
            }
            return rep.code(200).send({
                item,
                id,
                content,
                title,
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
