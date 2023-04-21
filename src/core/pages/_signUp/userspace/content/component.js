const axios = require("axios").default;
const Utils = require("../../../../lib/componentUtils").default;
const Cookies = require("../../../../lib/cookiesBrowser").default;
const pageConfig = require("../../page");

module.exports = class {
    onCreate(input, out) {
        this.state = {
            ready: false,
            error: null,
            activationType: null,
            activationValue: null,
        };
        this.language = out.global.language;
        this.siteTitle = out.global.siteTitle;
        this.siteId = out.global.siteId;
        this.cookieOptions = out.global.cookieOptions;
        this.authOptions = out.global.authOptions;
        this.mongoEnabled = out.global.mongoEnabled;
        this.systemRoutes = out.global.systemRoutes;
        this.passwordPolicy = out.global.passwordPolicy;
        if (process.browser && window.__heretic && window.__heretic.t) {
            this.authOptions = this.authOptions || window.__heretic.outGlobal.authOptions;
            this.mongoEnabled = this.mongoEnabled || window.__heretic.outGlobal.mongoEnabled;
            this.language = this.language || window.__heretic.outGlobal.language;
            this.siteTitle = out.global.siteTitle || window.__heretic.outGlobal.siteTitle;
            this.siteId = out.global.siteId || window.__heretic.outGlobal.siteId;
            this.cookieOptions = out.global.cookieOptions || window.__heretic.outGlobal.cookieOptions;
            this.systemRoutes = out.global.systemRoutes || window.__heretic.outGlobal.systemRoutes;
            this.passwordPolicy = out.global.passwordPolicy || window.__heretic.outGlobal.passwordPolicy;
            document.title = `${pageConfig.title[this.language]} – ${this.siteTitle}`;
        }
        this.utils = new Utils(this, this.language);
    }

    async onMount() {
        await this.utils.waitForLanguageData();
        await this.utils.loadLanguageData(pageConfig.id);
        this.t = window.__heretic.t;
        this.cookies = new Cookies(this.cookieOptions);
        const currentToken = this.cookies.get(`${this.siteId}.authToken`);
        if (currentToken) {
            setTimeout(() => window.location.href = this.utils.getLocalizedURL("/"), 1000);
            return;
        }
        this.setState("ready", true);
        const signUpForm = this.getComponent("signUpForm");
        setTimeout(() => signUpForm.focus());
    }

    async onSignUpFormSubmit() {
        this.utils.waitForComponent("signUpForm");
        const signUpForm = this.getComponent("signUpForm");
        signUpForm.setErrors(false);
        const validationResult = signUpForm.validate(signUpForm.saveView());
        if (validationResult) {
            return signUpForm.setErrors(signUpForm.getErrorData(validationResult));
        }
        const data = signUpForm.serializeData();
        signUpForm.setErrorMessage(null).setErrors(null).setLoading(true);
        try {
            await axios({
                method: "post",
                url: "/api/signUp",
                data,
                headers: {},
            });
            signUpForm.setLoading(false);
        } catch (e) {
            if (e && e.response && e.response.data) {
                if (e.response.data.form) {
                    const errorData = signUpForm.getErrorData(e.response.data.form);
                    signUpForm.setErrors(errorData);
                    if (errorData.find(i => i.errorCode === "hform_error_invalidCaptcha")) {
                        signUpForm.loadCaptchaData("captcha");
                    }
                }
                if (e.response.data.message) {
                    signUpForm.setErrorMessage(this.t(e.response.data.message));
                } else {
                    signUpForm.setErrorMessage(this.t("hform_error_general"));
                }
            } else {
                signUpForm.setErrorMessage(this.t("hform_error_general"));
            }
            signUpForm.setLoading(false);
        }
    }
};
