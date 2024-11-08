import fs from "fs-extra";
import path from "path";

export default class {
    constructor() {
        this.packageJson = JSON.parse(fs.readFileSync(path.resolve("./package.json"), "utf8"));
        this.etcPath = `${path.resolve(__dirname, "..", this.packageJson.imports["#etc/*"].replace(/\/\*$/, ""))}`;
    }

    async loadNavigationConfig() {
        return fs.readJSON(path.resolve(this.etcPath, "navigation.json"));
    }

    getPackageJson() {
        return this.packageJson;
    }
}
