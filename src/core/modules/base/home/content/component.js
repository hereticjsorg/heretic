import axios from "axios";
import Utils from "#lib/componentUtils";
import Cookies from "#lib/cookiesBrowser";
import pageConfig from "../page.js";
import moduleConfig from "../../module.js";

export default class {
    onCreate(input, out) {
        this.state = {
            ready: !process.browser,
            info: null,
            tab: "info",
        };
        this.language = out.global.language;
        this.siteTitle = out.global.siteTitle;
        this.siteId = out.global.siteId;
        this.cookieOptions = out.global.cookieOptions;
        this.systemRoutes = out.global.systemRoutes;
        this.webSockets = out.global.webSockets;
        this.authOptions = out.global.authOptions;
        this.mongoEnabled = out.global.mongoEnabled;
        if (process.browser) {
            window.__heretic = window.__heretic || {};
            window.__heretic.outGlobal = window.__heretic.outGlobal || out.global || {};
            this.authOptions = this.authOptions || window.__heretic.outGlobal.authOptions;
            this.mongoEnabled = this.mongoEnabled || window.__heretic.outGlobal.mongoEnabled;
            this.language = this.language || window.__heretic.outGlobal.language;
            this.siteTitle = out.global.siteTitle || window.__heretic.outGlobal.siteTitle;
            document.title = `${pageConfig.title[this.language]} – ${this.siteTitle}`;
            this.siteId = out.global.siteId || window.__heretic.outGlobal.siteId;
            this.cookieOptions = out.global.cookieOptions || window.__heretic.outGlobal.cookieOptions;
            this.systemRoutes = out.global.systemRoutes || window.__heretic.outGlobal.systemRoutes;
            this.webSockets = out.global.webSockets || window.__heretic.outGlobal.webSockets;
        }
        this.utils = new Utils(this, this.language);
    }

    async onMount() {
        await this.utils.waitForLanguageData();
        await this.utils.loadLanguageData(moduleConfig.id);
        this.cookies = new Cookies(this.cookieOptions);
        const currentToken = this.cookies.get(`${this.siteId}.authToken`);
        if (!currentToken) {
            setTimeout(() => window.location.href = `${this.utils.getLocalizedURL(this.systemRoutes.signInAdmin)}`, 100);
            return;
        }
        this.setState("ready", true);
        try {
            const response = await axios({
                method: "get",
                url: `/api/admin/sysInfo`,
                data: {},
                headers: {
                    Authorization: `Bearer ${currentToken}`,
                },
                onUploadProgress: () => {}
            });
            this.setState("info", response.data);
        } catch (e) {
            this.setState("ready", false);
            this.setState("failed", true);
        }
    }

    onTabClick(e) {
        const {
            id,
        } = e.target.closest("[data-id]").dataset;
        this.setState("tab", id);
    }
}
