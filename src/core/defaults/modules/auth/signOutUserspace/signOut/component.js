import axios from "axios";
import Utils from "#lib/componentUtils";
import Cookies from "#lib/cookiesBrowser";
import i18nLoader from "#build/loaders/i18n-loader-auth";
import moduleConfig from "../../module.js";
import pageConfig from "../page.js";

const languages = Object.keys(require("#etc/languages.json"));

export default class {
    async loadLanguageData() {
        if (process.browser && (!window.__heretic || !window.__heretic.languageData)) {
            window.__heretic = window.__heretic || {};
            if (!window.__heretic.languageData) {
                window.__heretic.languageData = await i18nLoader.loadLanguageFile(this.language);
            }
            window.__heretic.t = id => window.__heretic.languageData[id] ? typeof window.__heretic.languageData[id] === "function" ? window.__heretic.languageData[id]() : window.__heretic.languageData[id] : id;
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
        this.mongoEnabled = out.global.mongoEnabled;
        if (process.browser) {
            window.__heretic = window.__heretic || {};
            window.__heretic.outGlobal = window.__heretic.outGlobal || out.global;
            this.mongoEnabled = this.mongoEnabled || window.__heretic.outGlobal.mongoEnabled;
            this.language = this.language || window.__heretic.outGlobal.language;
            this.siteTitle = out.global.siteTitle || window.__heretic.outGlobal.siteTitle;
            this.siteId = out.global.siteId || window.__heretic.outGlobal.siteId;
            this.cookieOptions = out.global.cookieOptions || window.__heretic.outGlobal.cookieOptions;
            this.systemRoutes = out.global.systemRoutes || window.__heretic.outGlobal.systemRoutes;
            document.title = `${pageConfig.title[this.language]} – ${this.siteTitle}`;
        }
        await import(/* webpackChunkName: "bulma" */ "#site/view/bulma.scss");
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
}
