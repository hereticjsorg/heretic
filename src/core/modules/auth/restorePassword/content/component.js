import axios from "axios";
import Utils from "#lib/componentUtils";
import Cookies from "#lib/cookiesBrowser";
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
        if (process.browser && window.__heretic && window.__heretic.t) {
            this.authOptions = this.authOptions || window.__heretic.outGlobal.authOptions;
            this.mongoEnabled = this.mongoEnabled || window.__heretic.outGlobal.mongoEnabled;
            this.language = this.language || window.__heretic.outGlobal.language;
            this.siteTitle = out.global.siteTitle || window.__heretic.outGlobal.siteTitle;
            this.siteId = out.global.siteId || window.__heretic.outGlobal.siteId;
            this.cookieOptions = out.global.cookieOptions || window.__heretic.outGlobal.cookieOptions;
            this.systemRoutes = out.global.systemRoutes || window.__heretic.outGlobal.systemRoutes;
            this.passwordPolicy = out.global.passwordPolicy || window.__heretic.outGlobal.passwordPolicy;
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
            setTimeout(() => window.location.href = this.utils.getLocalizedURL("/"), 1000);
            return;
        }
        this.setState("ready", true);
        await this.utils.waitForComponent("restorePassword");
        const restorePasswordForm = this.getComponent("restorePassword");
        setTimeout(() => restorePasswordForm.focus());
    }

    async onRestorePasswordFormSubmit() {
        this.utils.waitForComponent("restorePassword");
        const restorePasswordForm = this.getComponent("restorePassword");
        restorePasswordForm.setErrors(false);
        const validationResult = restorePasswordForm.validate(restorePasswordForm.saveView());
        if (validationResult) {
            return restorePasswordForm.setErrors(restorePasswordForm.getErrorData(validationResult));
        }
        const data = restorePasswordForm.serializeData();
        restorePasswordForm.setErrorMessage(null).setErrors(null).setLoading(true);
        try {
            await axios({
                method: "post",
                url: moduleConfig.api.restorePassword,
                data: {
                    ...data,
                    language: this.language,
                },
                headers: {},
            });
            restorePasswordForm.setLoading(false);
            this.setState("success", true);
        } catch (e) {
            if (e && e.response && e.response.data) {
                if (e.response.data.form) {
                    const errorData = restorePasswordForm.getErrorData(e.response.data.form);
                    restorePasswordForm.setErrors(errorData);
                }
                if (e.response.data.message) {
                    restorePasswordForm.setErrorMessage(this.t(e.response.data.message));
                } else {
                    restorePasswordForm.setErrorMessage(this.t("hform_error_general"));
                }
                if (e.response.data.policyErrors) {
                    restorePasswordForm.setErrorMessage(`${this.t("passwordPolicyViolation")}: ${e.response.data.policyErrors.map(i => this.t(i)).join(", ")}`);
                }
                restorePasswordForm.loadCaptchaData("captcha");
            } else {
                restorePasswordForm.setErrorMessage(this.t("hform_error_general"));
            }
            restorePasswordForm.setLoading(false);
        }
    }
}
