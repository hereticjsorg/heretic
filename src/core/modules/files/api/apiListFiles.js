import fs from "fs-extra";
import path from "path";
import mime from "mime-types";
import FormData from "../data/form";
import moduleConfig from "../module.js";
import Utils from "./utils";
import FormValidator from "#lib/formValidatorServer";

export default () => ({
    async handler(req, rep) {
        const utils = new Utils(this);
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (
                !authData ||
                !authData.groupData ||
                !authData.groupData.find(
                    (i) => i.id === "admin" && i.value === true,
                )
            ) {
                return rep.error(
                    {
                        message: "Access Denied",
                    },
                    403,
                );
            }
            const formData = new FormData();
            const formValidator = new FormValidator(
                formData.getValidationSchema(),
                formData.getFieldsFlat(),
                this,
            );
            let multipartData;
            try {
                multipartData = await req.processMultipart();
            } catch (e) {
                await req.removeMultipartTempFiles();
                return rep.error({
                    message: e.message,
                });
            }
            const { data } = formValidator.parseMultipartData(multipartData);
            const validationResult = formValidator.validate();
            if (validationResult) {
                return rep.error({
                    form: validationResult,
                });
            }
            const par = data._default;
            par.dir = par.dir.replace(/\.\./gm, "").replace(/~/gm, "");
            const root = path
                .resolve(`${__dirname}/../${moduleConfig.root}`)
                .replace(/\\/gm, "/");
            const dir = par.dir
                ? path
                      .resolve(
                          `${__dirname}/../${moduleConfig.root}/${par.dir}`,
                      )
                      .replace(/\\/gm, "/")
                : root;
            if (dir.indexOf(root) !== 0) {
                return rep.error({
                    message: "Invalid directory",
                });
            }
            const dirData = (await fs.readdir(dir)).filter(
                (i) => !i.match(/^\./),
            );
            const files = [];
            for (const f of dirData) {
                const filePath = path.resolve(`${dir}/${f}`);
                const stats = await fs.lstat(filePath);
                if (!stats.isFile() && !stats.isDirectory()) {
                    continue;
                }
                const item = {
                    name: f,
                    ext: stats.isFile()
                        ? path.extname(f).replace(/^\./, "").toLowerCase()
                        : null,
                    dir: stats.isDirectory(),
                    // eslint-disable-next-line no-bitwise
                    permissions: `0${(stats.mode & 0o777).toString(8)}`,
                };
                if (stats.isFile()) {
                    const size = utils.formatBytes(stats.size);
                    item.size = size.size;
                    item.sizeUnit = size.unit;
                    item.mime =
                        f.indexOf(".") > 0
                            ? mime.lookup(f) || "application/octet-stream"
                            : "application/octet-stream";
                    if (
                        (await utils.isBinary(filePath)) ||
                        stats.size > moduleConfig.maxFileEditSizeBytes
                    ) {
                        item.binary = true;
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
    },
});
