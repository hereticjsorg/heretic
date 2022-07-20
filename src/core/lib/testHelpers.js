import path from "path";
import fs from "fs-extra";
import {
    execa
} from "execa";
import languages from "../../config/languages.json";

export default class {
    /* istanbul ignore file */
    async removeFile(file) {
        await fs.remove(path.resolve(__dirname, "..", "..", file));
    }

    /* istanbul ignore file */
    async readJSON(file) {
        return fs.readJSON(path.resolve(__dirname, "..", "..", file));
    }

    /* istanbul ignore file */
    async writeJSON(file, data) {
        await fs.writeJSON(path.resolve(__dirname, "..", "..", file), data, {
            spaces: "\t"
        });
    }

    /* istanbul ignore file */
    getLanguagesConfig() {
        return languages;
    }

    /* istanbul ignore file */
    getLanguagesList() {
        return Object.keys(languages);
    }

    /* istanbul ignore file */
    async fileExists(file) {
        try {
            await fs.access(path.resolve(__dirname, "..", "..", file), fs.F_OK);
            return true;
        } catch {
            return false;
        }
    }

    /* istanbul ignore file */
    async copy(src, dest) {
        await fs.copy(path.resolve(__dirname, "..", "..", src), path.resolve(__dirname, "..", "..", dest));
    }

    /* istanbul ignore file */
    async ensureDir(dir) {
        await fs.ensureDir(path.resolve(__dirname, "..", "..", dir));
    }

    /* istanbul ignore file */
    async writeFile(file, data) {
        await fs.writeFile(path.resolve(__dirname, "..", "..", file), data, {
            encoding: "utf8"
        });
    }

    /* istanbul ignore file */
    async doesServerFileExists() {
        return this.fileExists("dist/server.js");
    }

    /* istanbul ignore file */
    async doesPublicDirExists() {
        return this.fileExists("dist/public");
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
