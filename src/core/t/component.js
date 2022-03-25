module.exports = class {
    async onCreate(input, out) {
        this.language = out.global.language;
        this.languageData = {};
        if (!process.browser) {
            this.languages = require("../../../etc/languages.json");
            this.languageData = {
                ...require(`../../translations/core/${this.language}.json`)
            };
            if (out.global.i18nUser) {
                this.languageData = {
                    ...this.languageData,
                    ...require(`../../translations/${this.language}.json`)
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
