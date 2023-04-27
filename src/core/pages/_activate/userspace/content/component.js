const axios = require("axios");
const config = require("../../page.js");
const Utils = require("../../../../lib/componentUtils").default;
const Query = require("../../../../lib/queryBrowser").default;
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
        if (process.browser && window.__heretic && window.__heretic.t) {
            this.authOptions = this.authOptions || window.__heretic.outGlobal.authOptions;
            this.mongoEnabled = this.mongoEnabled || window.__heretic.outGlobal.mongoEnabled;
            this.language = this.language || window.__heretic.outGlobal.language;
            this.siteTitle = out.global.siteTitle || window.__heretic.outGlobal.siteTitle;
            this.siteId = out.global.siteId || window.__heretic.outGlobal.siteId;
            this.cookieOptions = out.global.cookieOptions || window.__heretic.outGlobal.cookieOptions;
            this.systemRoutes = out.global.systemRoutes || window.__heretic.outGlobal.systemRoutes;
            document.title = `${config.title[this.language]} – ${this.siteTitle}`;
        }
        this.utils = new Utils(this, this.language);
    }

    async onMount() {
        await this.utils.waitForLanguageData();
        await this.utils.loadLanguageData(pageConfig.id);
        this.t = window.__heretic.t;
        const query = new Query();
        const id = query.get("id");
        if (!id || typeof id !== "string" || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)) {
            return this.setState("error", true);
        }
        try {
            const {
                data,
            } = await axios({
                method: "post",
                url: pageConfig.api.activate,
                data: {
                    id,
                },
            });
            this.setState("activationType", data.type);
            this.setState("activationValue", data.value);
        } catch {
            return this.setState("error", true);
        }
        this.setState("ready", true);
    }

    onSignInButtonClick() {
        setTimeout(() => window.location.href = `${this.utils.getLocalizedURL(this.systemRoutes.signIn)}`);
    }
};
