const template = require("lodash.template");
// const routesData = require("#build/build.json");

module.exports = class {
    async onCreate(input, out) {
        this.language = out.global.language;
        this.languageData = {};
        if (!process.browser) {
            this.languages = require("#etc/languages.json");
            this.languageData = {
                ...require(`#src/translations/${this.language}.json`),
                ...require(`#site/translations/${this.language}.json`)
            };
            Object.keys(this.languageData).map(i => this.languageData[i] = template(this.languageData[i]));
        }
        this.pluralRules = new Intl.PluralRules(this.language);
    }

    translate() {
        let id;
        const data = process.browser ? window.__heretic.languageData : this.languageData;
        this.input.renderBody({
            w: i => id = i,
            t: i => id = id || i,
        });
        if (this.input.plural && String(this.input.plural).match(/^[0-9-.]+$/) && data[id]) {
            const pluralSelect = this.pluralRules.select(parseInt(this.input.plural, 10));
            id = `${id}${pluralSelect !== "other" ? `_${pluralSelect}` : ""}`;
        }
        return (data && data[id]) ? (this.input.arr && Array.isArray(data[id]) ? data[id][this.input.arr] : typeof data[id] === "function" ? data[id](this.input.data || {}) : data[id] || id) : id;
    }
};
