const i18nLoader = require("../../../../../build/i18n-loader-core");

module.exports = class {
    async loadLanguageData() {
        if (process.browser && (!window.__heretic || !window.__heretic.languageData)) {
            window.__heretic = window.__heretic || {};
            if (!window.__heretic.languageData) {
                window.__heretic.languageData = await i18nLoader.loadLanguageFile(this.language);
            }
            window.__heretic.t = id => window.__heretic.languageData[id] || id;
            window.__heretic.translationsLoaded = {};
            this.setState("languageLoaded", true);
        }
    }

    async onCreate(input, out) {
        this.state = {
            mounted: false,
            languageLoaded: false,
        };
        this.componentsLoaded = {};
        this.language = out.global.language;
        this.serverRoute = out.global.route;
        await import(/* webpackChunkName: "bulma" */ "../../../../../styles/bulma.scss");
        await import(/* webpackChunkName: "heretic-login-admin" */ "./heretic-login-admin.scss");
        await this.loadLanguageData();
    }

    onMount() {
        setTimeout(() => {
            this.setState("mounted", true);
        }, 50);
    }
};
