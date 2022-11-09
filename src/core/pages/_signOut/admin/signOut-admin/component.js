const Utils = require("../../../../lib/componentUtils").default;
const Cookies = require("../../../../lib/cookiesBrowser").default;
const languages = Object.keys(require("../../../../../config/languages.json"));
const config = require("../../page.js");

module.exports = class {
    async onCreate(input, out) {
        this.language = out.global.language;
        this.siteId = out.global.siteId;
        this.cookieOptions = out.global.cookieOptions;
        this.utils = new Utils(this, this.language);
        this.language = out.global.language;
        this.siteTitle = out.global.siteTitle;
        this.siteId = out.global.siteId;
        this.cookieOptions = out.global.cookieOptions;
        this.systemRoutes = out.global.systemRoutes;
        if (process.browser && window.__heretic && window.__heretic.t) {
            this.language = this.language || window.__heretic.outGlobal.language;
            this.siteTitle = out.global.siteTitle || window.__heretic.outGlobal.siteTitle;
            this.siteId = out.global.siteId || window.__heretic.outGlobal.siteId;
            this.cookieOptions = out.global.cookieOptions || window.__heretic.outGlobal.cookieOptions;
            this.systemRoutes = out.global.systemRoutes || window.__heretic.outGlobal.systemRoutes;
            document.title = `${config.title[this.language]} – ${this.siteTitle}`;
        }
    }

    async onMount() {
        await this.utils.waitForComponent("loading");
        this.getComponent("loading").setActive(true);
        this.cookies = new Cookies(this.cookieOptions);
        this.cookies.delete(`${this.siteId}.authToken`);
        setTimeout(() => window.location.href = languages[0] === this.language ? "/" : `/${this.language}`, 1000);
    }
};
