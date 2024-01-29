import store from "store2";
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
        this.language = out.global.language;
        if (process.browser) {
            this.store = store.namespace(`heretic_${this.siteId}`);
            window.__heretic = window.__heretic || {};
            window.__heretic.outGlobal = window.__heretic.outGlobal || out.global || {};
            this.siteId = out.global.siteId || window.__heretic.outGlobal.siteId;
            this.cookiesUserCheck = out.global.cookiesUserCheck || window.__heretic.outGlobal.cookiesUserCheck;
            this.language = this.language || window.__heretic.outGlobal.language;
            if (!this.cookiesUserCheck) {
                return;
            }
            this.cookiesAllowed = this.store.get("cookiesAllowed");
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
        this.store.set("cookiesAllowed", true);
        this.setState("visible", false);
    }
}
