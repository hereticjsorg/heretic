import fs from "fs-extra";
import path from "path";
import {
    template,
} from "lodash";

const emailComponents = {};
fs.readdirSync(path.resolve(__dirname, "../site/email")).map(f => emailComponents[f.replace(/\.html$/, "")] = template(fs.readFileSync(path.resolve(__dirname, "../site/email", f), "utf8")));

export default class {
    constructor(templateData) {
        this.templateData = templateData;
    }

    setTranslation(t) {
        this.t = t;
    }

    buildTemplate() {
        this.template = template(this.templateData, {
            ...emailComponents,
        });
    }
}
