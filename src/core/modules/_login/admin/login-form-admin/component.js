const axios = require("axios");
const i18nLoader = require("../../../../../build/i18n-loader-core");
const Utils = require("../../../../componentUtils").default;
const Cookies = require("../../../../cookiesBrowser").default;
const Query = require("../../../../queryBrowser").default;
const languages = require("../../../../../config/languages.json");

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
            ready: false,
            languageLoaded: false,
            langOpen: false,
        };
        this.componentsLoaded = {};
        this.language = out.global.language;
        this.serverRoute = out.global.route;
        this.siteId = out.global.siteId;
        this.cookieOptions = out.global.cookieOptions;
        this.utils = new Utils(this, this.language);
        await import(/* webpackChunkName: "bulma" */ "../../../../../styles/bulma.scss");
        await import(/* webpackChunkName: "heretic-login-admin" */ "./heretic-login-admin.scss");
        await this.loadLanguageData();
    }

    async onMount() {
        await this.utils.waitForLanguageData();
        await this.utils.loadLanguageData("_login");
        window.addEventListener("click", e => {
            if (!document.getElementById("hr_lang_dropdown").contains(e.target)) {
                this.setState("langOpen", false);
            }
        });
        this.setState("ready", true);
        this.update();
        this.t = window.__heretic.t;
        this.cookies = new Cookies(this.cookieOptions);
        this.query = new Query();
    }

    getNonLocalizedURL(url) {
        return this.utils.getNonLocalizedURL(url);
    }

    getLocalizedURL(url) {
        const nonLocalizedURL = this.getNonLocalizedURL(url);
        const resultURL = this.language === Object.keys(languages)[0] ? nonLocalizedURL.url : `/${this.language}${nonLocalizedURL.url}`;
        return resultURL.endsWith("/") && resultURL.length > 1 ? resultURL.slice(0, -1) : resultURL;
    }

    onLangDropdownClick(e) {
        e.preventDefault();
        e.stopPropagation();
        this.setState("langOpen", true);
    }

    async onFormSubmit() {
        const loginForm = this.getComponent("loginForm");
        loginForm.setErrors(false);
        const validationResult = loginForm.validate(loginForm.saveView());
        if (validationResult) {
            return loginForm.setErrors(loginForm.getErrorData(validationResult));
        }
        const data = loginForm.getFormDataObject(loginForm.serializeData());
        loginForm.setErrorMessage(null);
        loginForm.setErrors(null);
        loginForm.setLoading(true);
        try {
            await axios({
                method: "post",
                url: "/api/login",
                data,
                headers: {},
            });
            const token = "123";
            this.cookies.set(`${this.siteId}.authToken`, token);
            window.location.href = `${this.query.get("r") || this.getLocalizedURL("/").url || "/"}?n=${new Date().getTime()}`;
        } catch (e) {
            if (e && e.response && e.response.data) {
                if (e.response.data.form) {
                    loginForm.setErrors(loginForm.getErrorData(e.response.data.form));
                }
                if (e.response.data.message) {
                    loginForm.setErrorMessage(this.t(e.response.data.message));
                }
            } else {
                loginForm.setErrorMessage("hform_error_general");
            }
        } finally {
            loginForm.setLoading(false);
        }
    }
};
