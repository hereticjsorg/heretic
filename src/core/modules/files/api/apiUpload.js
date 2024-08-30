import path from "path";
import fs from "fs-extra";
import Utils from "./utils";

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
            let multipartData;
            try {
                multipartData = await req.processMultipart();
            } catch (e) {
                await req.removeMultipartTempFiles();
                return rep.error({
                    message: e.message,
                });
            }
            if (typeof multipartData.fields.dir !== "string") {
                await req.removeMultipartTempFiles();
                return rep.error({
                    message: "Invalid directory",
                });
            }
            const dir = utils.getPath(multipartData.fields.dir);
            if (!(await utils.fileExists(dir))) {
                await req.removeMultipartTempFiles();
                return rep.error({
                    message: "Directory doesn't exists",
                });
            }
            if (!this.systemConfig.demo) {
                for (const k of Object.keys(multipartData.files)) {
                    const item = multipartData.files[k];
                    if (
                        !item.filename.match(
                            /^(~|\.\.|con|prn|aux|nul|com[0-9]|lpt[0-9])$|([<>:"/\\|?*])|(\.|\s)$/gim,
                        )
                    ) {
                        await fs.move(
                            item.filePath,
                            path.resolve(dir, item.filename),
                        );
                    }
                }
            }
            await req.removeMultipartTempFiles();
            return rep.code(200).send({});
        } catch (e) {
            await req.removeMultipartTempFiles();
            this.log.error(e);
            return Promise.reject(e);
        }
    },
});
