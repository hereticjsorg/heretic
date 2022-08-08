const axios = require("axios");
const meta = require("../../module.json");
const Utils = require("../../../../lib/componentUtils").default;
const Cookies = require("../../../../lib/cookiesBrowser").default;
const Query = require("../../../../lib/queryBrowser").default;

module.exports = class {
    onCreate(input, out) {
        this.state = {
            ready: !process.browser,
        };
        this.language = out.global.language;
        this.siteTitle = out.global.siteTitle;
        this.siteId = out.global.siteId;
        this.cookieOptions = out.global.cookieOptions;
        if (process.browser && window.__heretic && window.__heretic.t) {
            this.language = this.language || window.__heretic.outGlobal.language;
            this.siteTitle = out.global.siteTitle || window.__heretic.outGlobal.siteTitle;
            this.siteId = out.global.siteId || window.__heretic.outGlobal.siteId;
            this.cookieOptions = out.global.cookieOptions || window.__heretic.outGlobal.cookieOptions;
            document.title = `${meta.title[this.language]} – ${this.siteTitle}`;
        }
        this.utils = new Utils(this, this.language);
    }

    getNonLocalizedURL(url) {
        return this.utils.getNonLocalizedURL(url);
    }

    getLocalizedURL(url) {
        return this.utils.getLocalizedURL(url);
    }

    async onMount() {
        await this.utils.waitForLanguageData();
        await this.utils.loadLanguageData("_signIn");
        this.t = window.__heretic.t;
        this.cookies = new Cookies(this.cookieOptions);
        this.query = new Query();
        const currentToken = this.cookies.get(`${this.siteId}.authToken`);
        if (currentToken) {
            setTimeout(() => window.location.href = `${this.getLocalizedURL("/").url || "/"}?_=${new Date().getTime()}`, 100);
            return;
        }
        this.setState("ready", true);
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
            const { token } = res.data;
            this.cookies.set(`${this.siteId}.authToken`, token);
            window.location.href = `${this.query.get("r") || this.getLocalizedURL("/").url || "/"}#${new Date().getTime()}`;
        } catch (e) {
            if (e && e.response && e.response.data) {
                if (e.response.data.form) {
                    signInForm.setErrors(signInForm.getErrorData(e.response.data.form));
                }
                if (e.response.data.message) {
                    signInForm.setErrorMessage(this.t(e.response.data.message));
                }
            } else {
                signInForm.setErrorMessage("hform_error_general");
            }
        } finally {
            signInForm.setLoading(false);
        }
    }
};
