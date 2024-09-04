import template from "lodash/template";
import Utils from "#lib/componentUtils.js";
import buildConfig from "#build/build.json";

export default class {
    async onCreate(input, out) {
        this.state = {
            ready: !process.browser,
        };
        this.language = out.global.language;
        this.languageData = {};
        if (!process.browser) {
            const DynamicLoader = (await import("#build/dynamicLoader.js")).default;
            this.languages = require("#etc/languages.json");
            this.languageData = {
                ...require(`#src/translations/${this.language}.json`),
                ...require(`#site/translations/${this.language}.json`),
            };
            for (const m of buildConfig.modules.filter((i) => i.translations)) {
                const translationLoaded = await DynamicLoader.loadTranslation(m.path, this.language);
                this.languageData = {
                    ...this.languageData,
                    ...(translationLoaded ? translationLoaded.default : {}),
                };
            }
            Object.keys(this.languageData).map(
                (i) => (this.languageData[i] = template(this.languageData[i])),
            );
        }
        this.pluralRules = new Intl.PluralRules(this.language);
        this.utils = new Utils();
        this.utils.waitForLanguageData().then(() => (this.state.ready = true));
    }

    translate() {
        let id;
        const data = process.browser
            ? window.__heretic.languageData
            : this.languageData;
        this.input.renderBody({
            w: (i) => (id = i),
            t: (i) => (id = id || i),
        });
        if (
            this.input.plural &&
            String(this.input.plural).match(/^[0-9-.]+$/) &&
            data[id]
        ) {
            const pluralSelect = this.pluralRules.select(
                parseInt(this.input.plural, 10),
            );
            id = `${id}${pluralSelect !== "other" ? `_${pluralSelect}` : ""}`;
        }
        return data && data[id]
            ? this.input.arr && Array.isArray(data[id])
                ? data[id][this.input.arr]
                : typeof data[id] === "function"
                  ? data[id](this.input.data || {})
                  : data[id] || id
            : id;
    }
}
