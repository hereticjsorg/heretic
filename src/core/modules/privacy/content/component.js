import axios from "axios";
import Utils from "#lib/componentUtils.js";
import pageConfig from "../site/page.js";
import moduleConfig from "../module.js";

export default class {
    onCreate(input, out) {
        this.state = {
            ready: !process.browser,
            policy: null,
            error: null,
            mode: input.mode,
        };
        this.language = out.global.language;
        this.siteTitle = out.global.siteTitle;
        this.siteId = out.global.siteId;
        this.cookieOptions = out.global.cookieOptions;
        this.systemRoutes = out.global.systemRoutes;
        if (process.browser) {
            window.__heretic = window.__heretic || {};
            window.__heretic.outGlobal =
                window.__heretic.outGlobal || out.global || {};
            this.language =
                this.language || window.__heretic.outGlobal.language;
            this.siteTitle =
                out.global.siteTitle || window.__heretic.outGlobal.siteTitle;
            document.title = `${pageConfig.title[this.language]} – ${this.siteTitle}`;
            this.siteId =
                out.global.siteId || window.__heretic.outGlobal.siteId;
            this.cookieOptions =
                out.global.cookieOptions ||
                window.__heretic.outGlobal.cookieOptions;
            this.systemRoutes =
                out.global.systemRoutes ||
                window.__heretic.outGlobal.systemRoutes;
        }
        this.utils = new Utils(this, this.language);
    }

    async onMount() {
        await this.utils.waitForLanguageData();
        await this.utils.loadLanguageData(moduleConfig.id);
        document.title = `${window.__heretic.t(this.state.mode === "site" ? "privacyPolicy" : "cookiesPolicy")}  – ${this.siteTitle}`;
        this.setState("ready", true);
        try {
            const { data } = await axios({
                method: "post",
                url: "/api/privacy/policy",
                data: {
                    type: this.state.mode,
                    language: this.language,
                },
            });
            this.setState("policy", data.html);
        } catch {
            this.setState("error", true);
        }
    }
}
