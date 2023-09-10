import fs from "fs-extra";
import path from "path";
import mime from "mime-types";
import FormData from "../data/form";
import moduleConfig from "../module.js";
import Utils from "./utils";
import FormValidator from "#lib/formValidatorServer";

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
            const formData = new FormData();
            const formValidator = new FormValidator(formData.getValidationSchema(), formData.getFieldsFlat(), this);
            const multipartData = await req.processMultipart();
            const {
                data,
            } = formValidator.parseMultipartData(multipartData);
            const validationResult = formValidator.validate();
            if (validationResult) {
                return rep.error({
                    form: validationResult,
                });
            }
            const par = data._default;
            par.dir = par.dir.replace(/\.\./gm, "").replace(/~/gm, "");
            const root = path.resolve(`${__dirname}/../${moduleConfig.root}`).replace(/\\/gm, "/");
            const dir = par.dir ? path.resolve(`${__dirname}/../${moduleConfig.root}/${req.body.dir}`).replace(/\\/gm, "/") : root;
            if (dir.indexOf(root) !== 0) {
                return rep.error({
                    message: "Invalid directory",
                });
            }
            const dirData = (await fs.readdir(dir)).filter(i => !i.match(/^\./));
            const files = [];
            for (const f of dirData) {
                const stats = await fs.lstat(path.resolve(`${dir}/${f}`));
                if (!stats.isFile() && !stats.isDirectory()) {
                    continue;
                }
                const item = {
                    name: f,
                    dir: stats.isDirectory(),
                    // eslint-disable-next-line no-bitwise
                    permissions: `0${(stats.mode & 0o777).toString(8)}`,
                };
                if (stats.isFile()) {
                    item.size = utils.formatBytes(stats.size);
                    item.mime = f.indexOf(".") > 0 ? mime.lookup(f) || "application/octet-stream" : "application/octet-stream";
                    if ((f.indexOf(".") > 0 && utils.isBinary(f)) || stats.size > moduleConfig.maxFileEditSizeBytes) {
                        data.binary = true;
                    }
                }
                files.push(item);
            }
            return rep.code(200).send({
                files,
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
