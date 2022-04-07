import path from "path";
import fs from "fs-extra";
import {
    execa
} from "execa";

export default class {
    /* istanbul ignore file */
    async removeFile(dir) {
        await fs.remove(path.resolve(__dirname, "..", "..", dir));
    }

    /* istanbul ignore file */
    async ensureFile(dir) {
        try {
            await fs.access(path.resolve(__dirname, "..", "..", dir), fs.F_OK);
            return true;
        } catch {
            return false;
        }
    }

    async doesServerFileExists() {
        return this.ensureFile("dist/server.js");
    }

    async doesPublicDirExists() {
        return this.ensureFile("dist/public");
    }

    /* istanbul ignore file */
    async build(suffix) {
        await this.removeFile("dist");
        const data = await execa(`npm run build-${suffix} -- --no-color`);
        const serverFileExists = await this.doesServerFileExists();
        const publicDirExists = await this.doesPublicDirExists();
        const buildResultMatch = data && data.exitCode === 0 && typeof data.stdout === "string" ? data.stdout.match(/compiled successfully/gm) : [];
        const buildSuccess = (buildResultMatch && Array.isArray(buildResultMatch) && buildResultMatch.length === 2);
        return {
            serverFileExists,
            publicDirExists,
            buildSuccess
        };
    }
}
