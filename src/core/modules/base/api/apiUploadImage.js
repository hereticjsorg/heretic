import fs from "fs-extra";
import path from "path";
import {
    v4 as uuidv4,
} from "uuid";
import moduleConfig from "../module.js";

export default () => ({
    async handler(req, rep) {
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (!authData || !authData.groupData || !authData.groupData.find(i => i.id === "admin" && i.value === true)) {
                return rep.error({
                    message: "Access Denied",
                }, 403);
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
            if (!multipartData.files || !multipartData.files.image || !multipartData.files.image.size > moduleConfig.maxUploadImageSize) {
                await req.removeMultipartTempFiles();
                return rep.error({
                    message: "Invalid image",
                });
            }
            const filename = this.systemConfig.demo ? "" : `${uuidv4()}${path.extname(multipartData.files.image.filename)}`;
            if (!this.systemConfig.demo) {
                await fs.ensureDir(path.resolve(__dirname, "public/images"));
                await fs.move(multipartData.files.image.filePath, path.resolve(__dirname, `public/images/${filename}`));
            }
            await req.removeMultipartTempFiles();
            return rep.code(200).send({
                success: 1,
                file: {
                    url: `/images/${filename}`,
                },
            });
        } catch (e) {
            await req.removeMultipartTempFiles();
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
