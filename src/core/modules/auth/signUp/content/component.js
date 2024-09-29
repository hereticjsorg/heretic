import axios from "axios";
import Utils from "#lib/componentUtils.js";
import Cookies from "#lib/cookiesBrowser.js";
import pageConfig from "../page.js";
import moduleConfig from "../../module.js";

export default class {
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
        this.passwordPolicy = out.global.passwordPolicy;
        this.demo = out.global.demo;
        if (process.browser) {
            window.__heretic = window.__heretic || {};
            window.__heretic.outGlobal =
                window.__heretic.outGlobal || out.global;
            this.authOptions =
                this.authOptions || window.__heretic.outGlobal.authOptions;
            this.mongoEnabled =
                this.mongoEnabled || window.__heretic.outGlobal.mongoEnabled;
            this.language =
                this.language || window.__heretic.outGlobal.language;
            this.siteTitle =
                out.global.siteTitle || window.__heretic.outGlobal.siteTitle;
            this.siteId =
                out.global.siteId || window.__heretic.outGlobal.siteId;
            this.cookieOptions =
                out.global.cookieOptions ||
                window.__heretic.outGlobal.cookieOptions;
            this.systemRoutes =
                out.global.systemRoutes ||
                window.__heretic.outGlobal.systemRoutes;
            this.passwordPolicy =
                out.global.passwordPolicy ||
                window.__heretic.outGlobal.passwordPolicy;
            this.demo = out.global.demo || window.__heretic.outGlobal.demo;
            document.title = `${pageConfig.title[this.language]} – ${this.siteTitle}`;
        }
        this.utils = new Utils(this, this.language);
    }

    async onMount() {
        await this.utils.waitForLanguageData();
        await this.utils.loadLanguageData(moduleConfig.id);
        this.t = window.__heretic.t;
        this.cookies = new Cookies(this.cookieOptions, this.siteId);
        const currentToken = this.cookies.get(`${this.siteId}.authToken`);
        if (currentToken) {
            setTimeout(
                () => (window.location.href = this.utils.getLocalizedURL("/")),
                1000,
            );
            return;
        }
        this.setState("ready", true);
        await this.utils.waitForComponent("signUpForm");
        const signUpForm = this.getComponent("signUpForm");
        setTimeout(() => signUpForm.focus());
    }

    async onSignUpFormSubmit() {
        this.utils.waitForComponent("signUpForm");
        const signUpForm = this.getComponent("signUpForm");
        signUpForm.setErrors(false);
        const validationResult = signUpForm.validate(signUpForm.saveView());
        if (validationResult) {
            return signUpForm.setErrors(
                signUpForm.getErrorData(validationResult),
            );
        }
        const data = signUpForm.serializeData();
        signUpForm.setErrorMessage(null).setErrors(null).setLoading(true);
        try {
            await axios({
                method: "post",
                url: moduleConfig.api.signUp,
                data: {
                    ...data,
                    language: this.language,
                },
                headers: {},
            });
            signUpForm.setLoading(false);
            this.setState("success", true);
        } catch (e) {
            if (e && e.response && e.response.data) {
                if (e.response.data.form) {
                    const errorData = signUpForm.getErrorData(
                        e.response.data.form,
                    );
                    signUpForm.setErrors(errorData);
                }
                if (e.response.data.message) {
                    signUpForm.setErrorMessage(this.t(e.response.data.message));
                } else {
                    signUpForm.setErrorMessage(this.t("hform_error_general"));
                }
                if (e.response.data.policyErrors) {
                    signUpForm.setErrorMessage(
                        `${this.t("passwordPolicyViolation")}: ${e.response.data.policyErrors.map((i) => this.t(i)).join(", ")}`,
                    );
                }
                signUpForm.loadCaptchaData("captcha");
            } else {
                signUpForm.setErrorMessage(this.t("hform_error_general"));
            }
            signUpForm.setLoading(false);
        }
    }

    onOAuthButtonClick(e) {
        e.preventDefault();
        const { path } = e.target.closest("[data-path]").dataset;
        this.utils.showOAuthPopup(path);
    }
}
