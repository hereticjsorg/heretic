const translatedModules = require("../../build/translated-modules.json");

module.exports = class {
    async onCreate(input, out) {
        this.language = out.global.language;
        this.languageData = {};
        if (!process.browser) {
            this.languages = require("../../config/languages.json");
            this.languageData = {
                ...require(`../../translations/core/${this.language}.json`),
                ...require(`../../translations/user/${this.language}.json`)
            };
            for (const module of translatedModules) {
                this.languageData = {
                    ...this.languageData,
                    ...require(`../../modules/${module}/translations/${this.language}.json`),
                };
            }
        }
    }

    translate() {
        let id;
        this.input.renderBody({
            w: i => id = i,
            t: i => id = id || i,
        });
        const data = process.browser ? window.__heretic.languageData : this.languageData;
        return data[id] || id;
    }
};
