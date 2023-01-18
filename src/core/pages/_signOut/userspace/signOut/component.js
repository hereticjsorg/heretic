const axios = require("axios").default;
const Utils = require("../../../../lib/componentUtils").default;
const Cookies = require("../../../../lib/cookiesBrowser").default;
const i18nLoader = require("../../../../../build/loaders/i18n-loader-core");
const languages = Object.keys(require("../../../../../../etc/languages.json"));
const moduleConfig = require("../../page.js");

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

    setGlobalVariables(out) {
        if (process.browser) {
            window.__heretic = window.__heretic || {};
            window.__heretic.outGlobal = out.global;
        }
    }

    async onCreate(input, out) {
        this.state = {
            failed: false,
        };
        this.language = out.global.language;
        this.siteId = out.global.siteId;
        this.cookieOptions = out.global.cookieOptions;
        this.utils = new Utils(this, this.language);
        this.language = out.global.language;
        this.siteTitle = out.global.siteTitle;
        this.siteId = out.global.siteId;
        this.cookieOptions = out.global.cookieOptions;
        this.systemRoutes = out.global.systemRoutes;
        if (process.browser && window.__heretic && window.__heretic.t) {
            this.language = this.language || window.__heretic.outGlobal.language;
            this.siteTitle = out.global.siteTitle || window.__heretic.outGlobal.siteTitle;
            this.siteId = out.global.siteId || window.__heretic.outGlobal.siteId;
            this.cookieOptions = out.global.cookieOptions || window.__heretic.outGlobal.cookieOptions;
            this.systemRoutes = out.global.systemRoutes || window.__heretic.outGlobal.systemRoutes;
            document.title = `${moduleConfig.title[this.language]} – ${this.siteTitle}`;
        }
        await import(/* webpackChunkName: "bulma" */ "../../../../../../site/view/bulma.scss");
        this.setGlobalVariables(out);
    }

    async onMount() {
        await this.loadLanguageData();
        await this.utils.waitForLanguageData();
        await this.utils.loadLanguageData(moduleConfig.id);
        if (!this.mongoEnabled) {
            return;
        }
        await this.utils.waitForComponent("loading");
        this.cookies = new Cookies(this.cookieOptions);
        const currentToken = this.cookies.get(`${this.siteId}.authToken`);
        this.getComponent("loading").setActive(true);
        try {
            await axios({
                method: "post",
                url: "/api/signOut",
                data: {},
                headers: {
                    Authorization: `Bearer ${currentToken}`,
                },
            });
            this.cookies.delete(`${this.siteId}.authToken`);
        } catch {
            this.setState("failed", true);
            return;
        }
        setTimeout(() => window.location.href = languages[0] === this.language ? "/" : `/${this.language}`, 1000);
    }
};
