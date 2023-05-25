const axios = require("axios").default;
const config = require("../../page.js");
const Utils = require("../../../../../src/core/lib/componentUtils").default;
const Cookies = require("../../../../../src/core/lib/cookiesBrowser").default;
const Query = require("../../../../../src/core/lib/queryBrowser").default;

module.exports = class {
    onCreate(input, out) {
        this.state = {
            ready: !process.browser,
        };
        this.language = out.global.language;
        this.siteTitle = out.global.siteTitle;
        this.siteId = out.global.siteId;
        this.cookieOptions = out.global.cookieOptions;
        this.authOptions = out.global.authOptions;
        this.mongoEnabled = out.global.mongoEnabled;
        this.systemRoutes = out.global.systemRoutes;
        if (process.browser && window.__heretic && window.__heretic.t) {
            this.authOptions = this.authOptions || window.__heretic.outGlobal.authOptions;
            this.mongoEnabled = this.mongoEnabled || window.__heretic.outGlobal.mongoEnabled;
            this.language = this.language || window.__heretic.outGlobal.language;
            this.siteTitle = out.global.siteTitle || window.__heretic.outGlobal.siteTitle;
            this.siteId = out.global.siteId || window.__heretic.outGlobal.siteId;
            this.cookieOptions = out.global.cookieOptions || window.__heretic.outGlobal.cookieOptions;
            this.systemRoutes = out.global.systemRoutes || window.__heretic.outGlobal.systemRoutes;
            document.title = `${config.title[this.language]} – ${this.siteTitle}`;
        }
        this.utils = new Utils(this, this.language);
    }

    getLocalizedURL(url) {
        return this.utils.getLocalizedURL(url);
    }

    receiveMessage(event) {
        if (event.origin !== window.location.origin) {
            return;
        }
        if (event && event.data && event.data.token) {
            const {
                token,
            } = event.data;
            this.cookies.set(`${this.siteId}.authToken`, token);
            window.location.href = this.utils.getLocalizedURL("/");
        }
    }

    async onMount() {
        await this.utils.waitForLanguageData();
        await this.utils.loadLanguageData("signIn");
        if (!this.mongoEnabled || !this.authOptions.signIn) {
            return;
        }
        this.t = window.__heretic.t;
        this.cookies = new Cookies(this.cookieOptions);
        this.query = new Query();
        const currentToken = this.cookies.get(`${this.siteId}.authToken`);
        if (currentToken) {
            setTimeout(() => window.location.href = `${this.utils.getLocalizedURL("/").url || "/"}`, 100);
            return;
        }
        window.addEventListener("message", this.receiveMessage.bind(this), false);
        this.setState("ready", true);
        if (window.__heretic && window.__heretic.setTippy) {
            window.__heretic.setTippy();
        }
    }

    async onFormSubmit() {
        this.utils.waitForComponent("signInForm");
        const signInForm = this.getComponent("signInForm");
        signInForm.setErrors(false);
        const validationResult = signInForm.validate(signInForm.saveView());
        if (validationResult) {
            return signInForm.setErrors(signInForm.getErrorData(validationResult));
        }
        const data = signInForm.getFormDataObject(signInForm.serializeData());
        signInForm.setErrorMessage(null).setErrors(null).setLoading(true);
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
    }

    onFormButtonClick(btn) {
        // eslint-disable-next-line no-console
        console.log(btn);
        switch (btn.id) {
        case "btnForgotPassword":
            setTimeout(() => window.location.href = `${this.utils.getLocalizedURL(this.systemRoutes.restorePassword)}`);
            break;
        }
    }

    onOAuthButtonClick(e) {
        e.preventDefault();
        const {
            path,
        } = e.target.closest("[data-path]").dataset;
        this.utils.showOAuthPopup(path);
    }
};
