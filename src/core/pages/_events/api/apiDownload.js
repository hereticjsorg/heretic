import path from "path";
import fs from "fs-extra";

const languages = Object.keys(require("../../../../config/languages.json"));

export default () => ({
    async handler(req, rep) {
        try {
            const authData = await req.auth.getData(req.auth.methods.COOKIE);
            if (!authData || !authData.groupData || !authData.groupData.find(i => i.id === "admin" && i.value === true)) {
                return rep.error({
                    message: "Access Denied",
                }, 403);
            }
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
