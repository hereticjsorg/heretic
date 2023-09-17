import path from "path";
import fs from "fs-extra";
import Utils from "./utils";
import moduleConfig from "../module.js";

const utils = new Utils();

export default () => ({
    async handler(req, rep) {
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (!authData || !authData.groupData || !authData.groupData.find(i => i.id === "admin" && i.value === true)) {
                return rep.error({
                    message: "Access Denied",
                }, 403);
            }
            const multipartData = await req.processMultipart();
            // eslint-disable-next-line no-console
            console.log(multipartData);
            if (typeof multipartData.fields.dir !== "string") {
                return rep.error({
                    message: "Invalid directory",
                });
            }
            const dirQuery = multipartData.fields.dir.replace(/\.\./gm, "").replace(/~/gm, "");
            const root = path.resolve(`${__dirname}/../${moduleConfig.root}`).replace(/\\/gm, "/");
            const dir = dirQuery ? path.resolve(`${__dirname}/../${moduleConfig.root}/${dirQuery}`).replace(/\\/gm, "/") : root;
            if (!(await utils.fileExists(dir))) {
                return rep.error({
                    message: "Directory doesn't exists",
                });
            }
            for (const k of Object.keys(multipartData.files)) {
                const item = multipartData.files[k];
                if (!item.filename.match(/^(~|\.\.|con|prn|aux|nul|com[0-9]|lpt[0-9])$|([<>:"/\\|?*])|(\.|\s)$/igm)) {
                    await fs.move(item.filePath, path.resolve(dir, item.filename));
                }
            }
            await req.removeMultipartTempFiles();
            return rep.code(200).send({});
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
