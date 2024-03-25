import {
    createHash,
} from "crypto";
import moduleConfig from "../module.js";
import languages from "#etc/languages.json";

export default () => ({
    async handler(req, rep) {
        try {
            const languagesList = Object.keys(languages);
            if (!req.body || !req.body.url || typeof req.body.url !== "string" || req.body.url.length > 1024 || !req.body.language || typeof req.body.language !== "string" || req.body.language.length > 5 || !languagesList.find(i => i === req.body.language)) {
                return rep.error({
                    message: "validation_error",
                });
            }
            const urlParts = req.body.url.split(/\//).filter(i => i);
            const url = urlParts.join("/");
            const pagePathHash = createHash("sha256").update(url).digest("base64");
            const item = await this.mongo.db.collection(moduleConfig.collections.content).findOne({
                pagePathHash,
            });
            if (!item || !item[req.body.language]) {
                return rep.error({
                    message: "Not Found",
                }, 404);
            }
            return rep.code(200).send(item[req.body.language]);
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
