const routesData = require("../../../build/build.json");

module.exports = class {
    async onCreate(input, out) {
        this.language = out.global.language;
        this.languageData = {};
        if (!process.browser) {
            this.languages = require("../../../config/languages.json");
            this.languageData = {
                geo: {
                    continents: require(`../../../translations/core/continents-${this.language}.json`),
                    countries: require(`../../../translations/core/countries-${this.language}.json`),
                },
                ...require(`../../../translations/core/${this.language}.json`),
                ...require(`../../../translations/user/${this.language}.json`)
            };
            for (const page of routesData.translatedPages.user) {
                this.languageData = {
                    ...this.languageData,
                    ...require(`../../../pages/${page}/translations/${this.language}.json`),
                };
            }
        }
    }

    translate() {
        let id;
        const data = process.browser ? window.__heretic.languageData : this.languageData;
        if (this.input.continent) {
            return data.geo.continents[this.input.continent] || this.input.continent;
        }
        if (this.input.country) {
            return data.geo.countries[this.input.country] || this.input.country;
        }
        this.input.renderBody({
            w: i => id = i,
            t: i => id = id || i,
        });
        return this.input.arr && Array.isArray(data[id]) ? data[id][this.input.arr] : data[id] || id;
    }
};
