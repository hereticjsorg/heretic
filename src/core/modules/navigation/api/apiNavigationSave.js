import fs from "fs-extra";
import path from "path";

const packageJson = JSON.parse(fs.readFileSync(path.resolve("./package.json"), "utf8"));
const navigationJsonPath = `${path.resolve(__dirname, "..", packageJson.imports["#etc/*"].replace(/\/\*$/, ""))}/navigation.json`;
const navigationJsonSite = fs.readJSONSync(navigationJsonPath);

export default () => ({
    async handler(req, rep) {
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
            await req.removeMultipartTempFiles();
            if (!multipartData.fields.tree || typeof multipartData.fields.tree !== "string" || multipartData.fields.tree.length > 102400 || !multipartData.fields.treeSecondary || typeof multipartData.fields.treeSecondary !== "string" || multipartData.fields.treeSecondary.length > 102400 || !multipartData.fields.homeId || typeof multipartData.fields.homeId !== "string" || multipartData.fields.homeId.length > 256
            ) {
                return rep.error({
                    message: "Invalid request",
                }, 400);
            }
            let tree;
            let treeSecondary;
            const { homeId } = multipartData.fields;
            try {
                tree = JSON.parse(multipartData.fields.tree);
                treeSecondary = JSON.parse(multipartData.fields.treeSecondary);
            } catch {
                return rep.error({
                    message: "Invalid request",
                }, 400);
            }
            navigationJsonSite.userspace.routes = tree;
            navigationJsonSite.userspace.routesSecondary = treeSecondary;
            navigationJsonSite.userspace.home = homeId.replace(/\"/gm, "");
            if (!this.systemConfig.demo) {
                await fs.writeJson(navigationJsonPath, navigationJsonSite, {
                    spaces: "    ",
                });
            }
            return rep.code(200).send({});
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    },
});
