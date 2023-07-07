const axios = require("axios");
const Utils = require("#lib/componentUtils").default;
const Query = require("#lib/queryBrowser").default;
const pageConfig = require("../page.js");
const moduleConfig = require("../../module.js");

module.exports = class {
    onCreate(input, out) {
        this.state = {
            ready: false,
            error: null,
            activationType: null,
            activationValue: null,
            success: false,
        };
        this.language = out.global.language;
        this.siteTitle = out.global.siteTitle;
        this.siteId = out.global.siteId;
        this.cookieOptions = out.global.cookieOptions;
        this.authOptions = out.global.authOptions;
        this.mongoEnabled = out.global.mongoEnabled;
        this.systemRoutes = out.global.systemRoutes;
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
            document.title = `${pageConfig.title[this.language]} – ${this.siteTitle}`;
        }
        this.utils = new Utils(this, this.language);
    }

    async onMount() {
        // eslint-disable-next-line no-console
        console.log("0");
        await this.utils.waitForLanguageData();
        await this.utils.loadLanguageData(moduleConfig.id);
        // eslint-disable-next-line no-console
        console.log("0-1");
        this.t = window.__heretic.t;
        const query = new Query();
        this.id = query.get("id");
        if (!this.id || typeof this.id !== "string" || !this.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)) {
            // eslint-disable-next-line no-console
            console.log("1");
            return this.setState("error", true);
        }
        try {
            const {
                data,
            } = await axios({
                method: "post",
                url: moduleConfig.api.activate,
                data: {
                    id: this.id,
                },
            });
            this.setState("activationType", data.type);
            this.setState("activationValue", data.value);
        } catch {
            // eslint-disable-next-line no-console
            console.log("2");
            return this.setState("error", true);
        }
        // eslint-disable-next-line no-console
        console.log("3");
        this.setState("ready", true);
    }

    onSignInButtonClick() {
        setTimeout(() => window.location.href = `${this.utils.getLocalizedURL(this.systemRoutes.signIn)}`);
    }

    async onSetPasswordFormSubmit() {
        this.utils.waitForComponent("setPassword");
        const setPasswordForm = this.getComponent("setPassword");
        setPasswordForm.setErrors(false);
        const validationResult = setPasswordForm.validate(setPasswordForm.saveView());
        if (validationResult) {
            return setPasswordForm.setErrors(setPasswordForm.getErrorData(validationResult));
        }
        const data = setPasswordForm.serializeData();
        setPasswordForm.setErrorMessage(null).setErrors(null).setLoading(true);
        try {
            await axios({
                method: "post",
                url: moduleConfig.api.setPassword,
                data: {
                    ...data,
                    language: this.language,
                    id: this.id,
                },
                headers: {},
            });
            setPasswordForm.setLoading(false);
            this.setState("success", true);
        } catch (e) {
            if (e && e.response && e.response.data) {
                if (e.response.data.form) {
                    const errorData = setPasswordForm.getErrorData(e.response.data.form);
                    setPasswordForm.setErrors(errorData);
                }
                if (e.response.data.message) {
                    setPasswordForm.setErrorMessage(this.t(e.response.data.message));
                } else {
                    setPasswordForm.setErrorMessage(this.t("hform_error_general"));
                }
                if (e.response.data.policyErrors) {
                    setPasswordForm.setErrorMessage(`${this.t("passwordPolicyViolation")}: ${e.response.data.policyErrors.map(i => this.t(i)).join(", ")}`);
                }
                setPasswordForm.loadCaptchaData("captcha");
            } else {
                setPasswordForm.setErrorMessage(this.t("hform_error_general"));
            }
            setPasswordForm.setLoading(false);
        }
    }
};
