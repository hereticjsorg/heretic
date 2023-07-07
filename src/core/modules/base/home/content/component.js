const axios = require("axios").default;
const Utils = require("#lib/componentUtils").default;
const Cookies = require("#lib/cookiesBrowser").default;
const pageConfig = require("../page.js");
const moduleConfig = require("../../module.js");

module.exports = class {
    onCreate(input, out) {
        this.state = {
            ready: !process.browser,
            info: null,
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
            this.setState("failed", true);
            return;
        }
        this.setState("ready", true);
    }
};
