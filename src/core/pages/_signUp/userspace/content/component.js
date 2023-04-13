const debounce = require("lodash.debounce");
const Utils = require("../../../../lib/componentUtils").default;
const Cookies = require("../../../../lib/cookiesBrowser").default;
const Password = require("../../../../lib/password").default;
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

    onPasswordChange() {
        this.password.onPasswordChange("hr_hf_el_signUpForm_passwordPolicy", "hr_hf_el_signUpForm_password");
    }

    async onMount() {
        await this.utils.waitForLanguageData();
        await this.utils.loadLanguageData(pageConfig.id);
        this.t = window.__heretic.t;
        this.password = new Password(this.passwordPolicy, this.t);
        this.cookies = new Cookies(this.cookieOptions);
        const currentToken = this.cookies.get(`${this.siteId}.authToken`);
        if (currentToken) {
            setTimeout(() => window.location.href = this.utils.getLocalizedURL("/"), 1000);
            return;
        }
        this.setState("ready", true);
        await this.utils.waitForComponent("signUpForm");
        await this.utils.waitForElement("hr_hf_el_signUpForm_passwordPolicy");
        await this.utils.waitForElement("hr_hf_el_signUpForm_password");
        document.getElementById("hr_hf_el_signUpForm_password").addEventListener("keydown", debounce(this.onPasswordChange.bind(this), 50));
        this.onPasswordChange();
        const signUpForm = this.getComponent("signUpForm");
        setTimeout(() => signUpForm.focus());
    }

    onSignUpFormSubmit() {

    }
};
