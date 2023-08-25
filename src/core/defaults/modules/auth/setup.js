import fs from "fs-extra";
import path from "path";
import moduleConfig from "./module";
import Auth from "#lib/auth";

export default class {
    constructor(id, fastify, func, installedVersions) {
        this.fastify = fastify;
        this.id = id;
        this.func = func;
        this.installedVersion = installedVersions[id];
        this.auth = new Auth(this.fastify);
    }

    async process() {
        await fs.ensureDir(path.resolve(__dirname, "public", moduleConfig.profilePicture.directory));
    }
}
