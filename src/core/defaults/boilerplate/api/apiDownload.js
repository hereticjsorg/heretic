import path from "path";
import fs from "fs-extra";
import {
    ObjectId,
} from "mongodb";
import moduleConfig from "../module.js";
import utils from "./utils";

const languages = Object.keys(require("#etc/languages.json"));

export default () => ({
    async handler(req, rep) {
        try {
            const authData = await req.auth.getData(req.auth.methods.COOKIE);
            const {
                id,
            } = req.query;
            const language = req.query.language && typeof req.query.language === "string" && languages.indexOf(req.query.language) > -1 ? req.query.language : languages[0];
            const redirectNotFound = () => rep.code(301).redirect(languages[0] === language ? `/notFound` : `/${language}/notFound`);
            if (!authData || !id || typeof id !== "string" || !id.match(/^[0-9a-f]{8}\b-[0-9a-f]{4}\b-[0-9a-f]{4}\b-[0-9a-f]{4}\b-[0-9a-f]{12}$/)) {
                return redirectNotFound();
            }
            const filePath = path.resolve(__dirname, this.systemConfig.directories.files, id);
            try {
                await fs.access(filePath, fs.F_OK);
            } catch (e) {
                return redirectNotFound();
            }
            const fileDb = await this.mongo.db.collection(this.systemConfig.collections.files).findOne({
                _id: id,
            });
            if (!fileDb) {
                return redirectNotFound();
            }
            if (fileDb.refId) {
                const refDb = await this.mongo.db.collection(moduleConfig.collections.main).findOne({
                    _id: new ObjectId(fileDb.refId),
                });
                if (!refDb || !utils.isSaveAllowed(authData, refDb)) {
                    return redirectNotFound();
                }
            }
            const stream = await fs.createReadStream(filePath);
            await rep.code(200).headers({
                "Content-Disposition": `attachment; filename="${fileDb.filename}`,
                "Content-Type": "application/octet-stream",
            }).send(stream);
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
