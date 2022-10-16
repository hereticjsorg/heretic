const Utils = require("../../../../lib/componentUtils").default;
const Query = require("../../../../lib/queryBrowser").default;
const Cookies = require("../../../../lib/cookiesBrowser").default;
const moduleConfig = require("../../admin.js");

module.exports = class {
    onCreate(input, out) {
        this.state = {
            ready: !process.browser,
            headers: {},
        };
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
            document.title = `${moduleConfig.title[this.language]} – ${this.siteTitle}`;
        }
        this.utils = new Utils(this, this.language);
    }

    async onMount() {
        await this.utils.waitForLanguageData();
        await this.utils.loadLanguageData(moduleConfig.id);
        this.query = new Query();
        this.cookies = new Cookies(this.cookieOptions);
        const currentToken = this.cookies.get(`${this.siteId}.authToken`);
        if (!currentToken) {
            setTimeout(() => window.location.href = `${this.getLocalizedURL(this.systemRoutes.signIn)}?r=${this.getLocalizedURL(moduleConfig.routes.userspace.list.path)}`, 100);
            return;
        }
        this.setState("headers", {
            Authorization: `Bearer ${currentToken}`
        });
        this.setState("ready", true);
    }

    async onTopButtonClick(id) {
        switch (id) {
        case "newItem":
            await this.utils.waitForComponent(`${moduleConfig}EditModalDialog`);
            const modalDialog = await this.getComponent(`${moduleConfig}EditModalDialog`).getModal();
            modalDialog.setActive(true).setCloseAllowed(true).setBackgroundCloseAllowed(false).setLoading(false);
            break;
        }
    }

    onActionButtonClick(data) {
        switch (data.buttonId) {
        case "edit":
            // id: data.itemId,
            break;
        }
    }

    onUnauthorized() {}
};
