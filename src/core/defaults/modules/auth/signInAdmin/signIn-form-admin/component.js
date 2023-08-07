import axios from "axios";
import store from "store2";
import template from "lodash.template";
import i18nLoader from "#build/loaders/i18n-loader-core";
import Utils from "#lib/componentUtils";
import Cookies from "#lib/cookiesBrowser";
import Query from "#lib/queryBrowser";
import moduleConfig from "../../module.js";

export default class {
    async loadLanguageData() {
        if (process.browser && (!window.__heretic || !window.__heretic.languageData)) {
            window.__heretic = window.__heretic || {};
            if (!window.__heretic.languageData) {
                window.__heretic.languageData = await i18nLoader.loadLanguageFile(this.language);
                Object.keys(window.__heretic.languageData).map(i => window.__heretic.languageData[i] = typeof window.__heretic.languageData[i] === "string" ? template(window.__heretic.languageData[i]) : window.__heretic.languageData[i]);
            }
            window.__heretic.t = id => window.__heretic.languageData[id] ? typeof window.__heretic.languageData[id] === "function" ? window.__heretic.languageData[id]() : window.__heretic.languageData[id] : id;
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
        this.siteId = out.global.siteId;
        this.cookieOptions = out.global.cookieOptions;
        this.systemRoutes = out.global.systemRoutes;
        this.authOptions = out.global.authOptions;
        this.mongoEnabled = out.global.mongoEnabled;
        if (process.browser) {
            window.__heretic = window.__heretic || {};
            window.__heretic.outGlobal = window.__heretic.outGlobal || out.global;
            this.authOptions = this.authOptions || window.__heretic.outGlobal.authOptions;
            this.mongoEnabled = this.mongoEnabled || window.__heretic.outGlobal.mongoEnabled;
            this.language = this.language || window.__heretic.outGlobal.language;
            this.siteTitle = out.global.siteTitle || window.__heretic.outGlobal.siteTitle;
            this.siteId = out.global.siteId || window.__heretic.outGlobal.siteId;
            this.cookieOptions = out.global.cookieOptions || window.__heretic.outGlobal.cookieOptions;
            this.systemRoutes = out.global.systemRoutes || window.__heretic.outGlobal.systemRoutes;
        }
        this.utils = new Utils(this, this.language);
        await import( /* webpackChunkName: "bulma" */ "#site/view/bulma.scss");
        await import( /* webpackChunkName: "heretic-signIn-admin" */ "./heretic-signIn-admin.scss");
        await this.loadLanguageData();
    }

    async onMount() {
        await this.utils.waitForLanguageData();
        await this.utils.loadLanguageData(moduleConfig.id);
        if (!this.mongoEnabled) {
            return;
        }
        window.addEventListener("click", e => {
            if (document.getElementById("hr_lang_dropdown") && !document.getElementById("hr_lang_dropdown").contains(e.target)) {
                this.setState("langOpen", false);
            }
        });
        this.store = store.namespace(`heretic_${this.siteId}`);
        const darkMode = !!this.store.get("darkMode");
        document.documentElement.classList[darkMode ? "add" : "remove"]("heretic-dark");
        this.setState("ready", true);
        this.update();
        this.t = window.__heretic.t;
        this.cookies = new Cookies(this.cookieOptions);
        this.query = new Query();
    }

    onLangDropdownClick(e) {
        e.preventDefault();
        e.stopPropagation();
        this.setState("langOpen", true);
    }

    authErrorHandler(signInForm, e) {
        if (e && e.response && e.response.data) {
            if (e.response.data.form) {
                signInForm.setErrors(signInForm.getErrorData(e.response.data.form));
            }
            if (e.response.data.message) {
                signInForm.setErrorMessage(this.t(e.response.data.message));
            }
        } else {
            signInForm.setErrorMessage(this.t("hform_error_general"));
        }
        signInForm.setLoading(false);
    }

    async onFormSubmit() {
        const signInForm = this.getComponent("signInForm");
        signInForm.setErrors(false);
        const validationResult = signInForm.validate(signInForm.saveView());
        if (validationResult) {
            return signInForm.setErrors(signInForm.getErrorData(validationResult));
        }
        const serializedData = signInForm.serializeData();
        const data = signInForm.getFormDataObject(serializedData);
        signInForm.setErrorMessage(null);
        signInForm.setErrors(null);
        signInForm.setLoading(true);
        try {
            const res = await axios({
                method: "post",
                url: "/api/signIn",
                data,
                headers: {},
            });
            const {
                token,
                needCode,
            } = res.data;
            if (needCode) {
                signInForm.setLoading(false);
                await this.utils.waitForComponent("tfaModal");
                const tfaModal = await this.getComponent("tfaModal").getModalInstance();
                tfaModal.setCloseAllowed(true).setLoading(false).setActive(true);
                this.getComponent("tfaModal").setCredentials(serializedData.formTabs._default.username, serializedData.formTabs._default.password);
                this.getComponent("tfaModal").onTfaGotAppClick();
            } else {
                this.cookies.set(`${this.siteId}.authToken`, token);
                window.location.href = `${this.query.get("r") || this.utils.getLocalizedURL(this.systemRoutes.admin) || "/"}`;
            }
        } catch (e) {
            this.authErrorHandler(signInForm, e);
        }
    }

    async on2faCode(code) {
        this.utils.waitForComponent("signInForm");
        const signInForm = this.getComponent("signInForm");
        signInForm.setValue("code", code);
        signInForm.setLoading(true);
        const data = signInForm.getFormDataObject(signInForm.serializeData());
        try {
            const res = await axios({
                method: "post",
                url: "/api/signIn",
                data,
                headers: {},
            });
            const {
                token,
            } = res.data;
            this.cookies.set(`${this.siteId}.authToken`, token);
            window.location.href = `${this.query.get("r") || this.utils.getLocalizedURL("/") || "/"}`;
        } catch (e) {
            this.authErrorHandler(signInForm, e);
        }
    }

    async on2faRecovery() {
        await this.utils.waitForComponent("tfaModal");
        const tfaModal = await this.getComponent("tfaModal").getModalInstance();
        tfaModal.setCloseAllowed(true).setLoading(false).setActive(false);
        this.onFormSubmit();
    }
}
