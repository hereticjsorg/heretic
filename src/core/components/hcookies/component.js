import Cookies from "#lib/cookiesBrowser";
import Utils from "#lib/componentUtils";

export default class {
    async onCreate(input, out) {
        this.state = {
            visible: false,
        };
        if (input.admin) {
            await import( /* webpackChunkName: "hcookies-admin" */ "./style-admin.scss");
        } else {
            await import( /* webpackChunkName: "hcookies-frontend" */ "./style-frontend.scss");
        }
        this.siteId = out.global.siteId;
        this.cookiesUserCheck = out.global.cookiesUserCheck;
        this.cookieOptions = out.global.cookieOptions;
        this.language = out.global.language;
        if (process.browser) {
            window.__heretic = window.__heretic || {};
            window.__heretic.outGlobal = window.__heretic.outGlobal || out.global || {};
            this.siteId = out.global.siteId || window.__heretic.outGlobal.siteId;
            this.cookiesUserCheck = out.global.cookiesUserCheck || window.__heretic.outGlobal.cookiesUserCheck;
            this.cookieOptions = out.global.cookieOptions || window.__heretic.outGlobal.cookieOptions;
            this.language = this.language || window.__heretic.outGlobal.language;
            if (!this.cookiesUserCheck) {
                return;
            }
            const expires = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
            this.cookies = new Cookies({
                ...this.cookieOptions,
                expires,
            }, this.siteId);
            this.cookiesAllowed = this.cookies.get(`${this.siteId}.cookiesAllowed`);
        }
    }

    async onMount() {
        this.utils = new Utils(this, this.language);
        await this.utils.waitForLanguageData();
        if (!this.cookiesAllowed) {
            this.setState("visible", true);
        }
    }

    onCookiesAllowClick(e) {
        e.preventDefault();
        this.cookies.set(`${this.siteId}.cookiesAllowed`, true);
        this.setState("visible", false);
    }
}
