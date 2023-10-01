import fs from "fs-extra";
import Utils from "./utils";

const languages = Object.keys(require("#etc/languages.json"));

export default () => ({
    async handler(req, rep) {
        const utils = new Utils(this);
        try {
            const authData = await req.auth.getData(req.auth.methods.COOKIE);
            if (!authData || !authData.groupData || !authData.groupData.find(i => i.id === "admin" && i.value === true)) {
                return rep.error({
                    message: "Access Denied",
                }, 403);
            }
            const reqData = req.query;
            const language = reqData.language && typeof reqData.language === "string" && languages.indexOf(reqData.language) > -1 ? reqData.language : languages[0];
            const redirectNotFound = () => rep.code(301).redirect(languages[0] === language ? `/notFound` : `/${language}/notFound`);
            if (typeof reqData.dir !== "string" || typeof reqData.filename !== "string") {
                return redirectNotFound();
            }
            const filePath = utils.getPath(`${reqData.dir}/${reqData.filename}`);
            if (!(await utils.fileExists(filePath))) {
                return redirectNotFound();
            }
            const stream = await fs.createReadStream(filePath);
            await rep.code(200).headers({
                "Content-Disposition": `attachment; filename="${reqData.filename}`,
                "Content-Type": "application/octet-stream",
            }).send(stream);
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
