// const axios = require("axios");
const Utils = require("../../../../lib/componentUtils").default;
const Cookies = require("../../../../lib/cookiesBrowser").default;
const languages = Object.keys(require("../../../../../config/languages.json"));

module.exports = class {
    async onCreate(input, out) {
        this.language = out.global.language;
        this.siteId = out.global.siteId;
        this.cookieOptions = out.global.cookieOptions;
        this.utils = new Utils(this, this.language);
        this.systemRoutes = out.global.systemRoutes;
    }

    async onMount() {
        await this.utils.waitForComponent("loading");
        this.getComponent("loading").setActive(true);
        this.cookies = new Cookies(this.cookieOptions);
        this.cookies.delete(`${this.siteId}.authToken`);
        setTimeout(() => window.location.href = languages[0] === this.language ? "/" : `/${this.language}`, 1000);
    }
};
