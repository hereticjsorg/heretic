import Utils from "#lib/componentUtils";
import Cookies from "#lib/cookiesBrowser";
import moduleConfig from "../module.js";

export default class {
    onCreate(input, out) {
        this.state = {
            view: "2fa",
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
        }
        this.utils = new Utils(this, this.language);
    }

    getLocalizedURL(url) {
        return this.utils.getLocalizedURL(url);
    }

    async onMount() {
        await this.utils.waitForLanguageData();
        await this.utils.loadLanguageData(moduleConfig.id);
        if (!this.mongoEnabled || !this.authOptions.signIn) {
            return;
        }
        this.t = window.__heretic.t;
        this.cookies = new Cookies(this.cookieOptions);
        this.setState("view", "2fa");
        this.setState("ready", true);
    }

    async getModalInstance() {
        await this.utils.waitForComponent("tfaModal");
        return this.getComponent("tfaModal");
    }

    async onTfaNoAppClick(e) {
        e.preventDefault();
        this.setState("view", "recovery");
        await this.utils.waitForComponent("tfaRecoveryForm");
        setTimeout(() => this.getComponent("tfaRecoveryForm").focus());
    }

    async onTfaGotAppClick(e) {
        e.preventDefault();
        this.setState("view", "2fa");
        await this.utils.waitForComponent("tfaOtpForm");
        setTimeout(() => this.getComponent("tfaOtpForm").focus());
    }

    onRecoveryFormSubmit() {
        // OK
    }

    onOtpFormSubmit() {
        // OK
    }

    onTfaButtonClick(id) {
        switch (id) {
        case "save":
            if (this.state.view === "2fa") {
                this.onOtpFormSubmit();
            } else {
                this.onRecoveryFormSubmit();
            }
            break;
        }
    }
}
