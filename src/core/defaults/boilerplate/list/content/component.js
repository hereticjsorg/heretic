const axios = require("axios").default;
const Utils = require("#lib/componentUtils").default;
const Query = require("#lib/queryBrowser").default;
const Cookies = require("#lib/cookiesBrowser").default;
const pageConfig = require("../page.js");
const moduleConfig = require("../../module.js");

module.exports = class {
    async onCreate(input, out) {
        this.state = {
            ready: !process.browser,
            headers: {},
        };
        this.language = out.global.language;
        this.siteTitle = out.global.siteTitle;
        this.siteId = out.global.siteId;
        this.cookieOptions = out.global.cookieOptions;
        this.systemRoutes = out.global.systemRoutes;
        if (process.browser) {
            window.__heretic = window.__heretic || {};
            window.__heretic.outGlobal = window.__heretic.outGlobal || out.global;
            this.language = this.language || window.__heretic.outGlobal.language;
            this.siteTitle = out.global.siteTitle || window.__heretic.outGlobal.siteTitle;
            this.siteId = out.global.siteId || window.__heretic.outGlobal.siteId;
            this.cookieOptions = out.global.cookieOptions || window.__heretic.outGlobal.cookieOptions;
            this.systemRoutes = out.global.systemRoutes || window.__heretic.outGlobal.systemRoutes;
            document.title = `${pageConfig.title[this.language]} – ${this.siteTitle}`;
        }
        this.utils = new Utils(this, this.language);
    }

    getNonLocalizedURL(url) {
        return this.utils.getNonLocalizedURL(url);
    }

    getLocalizedURL(url) {
        return this.utils.getLocalizedURL(url);
    }

    async onWebSocketMessage(e) {
        if (e && e.data && e.isTrusted) {
            try {
                const data = JSON.parse(e.data);
                await this.utils.waitForComponent(`${moduleConfig.id}List`);
                const table = this.getComponent(`${moduleConfig.id}List`);
                table.setLock(data.id, data.action === "locked" ? data.username : null);
            } catch {
                // Ignore
            }
        }
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
        await this.utils.waitForComponent(`${moduleConfig.id}List`);
        // Show sucess notification when required
        if (window.__heretic.routeExtra) {
            if (window.__heretic.routeExtra.success) {
                await this.utils.waitForComponent(`notify_${moduleConfig.id}List`);
                this.getComponent(`notify_${moduleConfig.id}List`).show(window.__heretic.t("saveSuccess"), "is-success");
            }
            window.__heretic.routeExtra = {};
        }
        if (window.__heretic.webSocket) {
            window.__heretic.webSocket.addEventListener("message", this.onWebSocketMessage.bind(this));
        }
    }

    onTopButtonClick(id) {
        switch (id) {
        case "newItem":
            const options = {
                ...this.query.getStore(),
            };
            options[`mode_${moduleConfig.id}Form`] = "edit";
            window.__heretic.router.navigate(`${moduleConfig.id}_edit`, this.language, options);
            break;
        }
    }

    async onActionButtonClick(data) {
        this.utils.waitForComponent(`notify_${moduleConfig.id}List`);
        const notify = this.getComponent(`notify_${moduleConfig.id}List`);
        this.utils.waitForComponent(`${moduleConfig.id}List`);
        const table = this.getComponent(`${moduleConfig.id}List`);
        switch (data.buttonId) {
        case "edit":
            try {
                table.setLoading(true);
                const response = await axios({
                    method: "post",
                    url: `/api/${moduleConfig.id}/lock/check`,
                    data: {
                        id: data.itemId,
                    },
                    headers: this.state.headers,
                });
                if (response.data.lock) {
                    notify.show(`${window.__heretic.t("lockedBy")}: ${response.data.lock.username}`, "is-danger");
                    return;
                }
            } catch {
                notify.show(window.__heretic.t("couldNotLoadLockData"), "is-danger");
                return;
            } finally {
                table.setLoading(false);
            }
            this.query.buildStore();
            const options = {
                ...this.query.getStore(),
                id: data.itemId,
            };
            options[`mode_${moduleConfig.id}Form`] = "view";
            window.__heretic.router.navigate(`${moduleConfig.id}_edit`, this.language, options);
            break;
        }
    }

    onUnauthorized() {
        this.setState("ready", false);
        setTimeout(() => window.location.href = `${this.getLocalizedURL(this.systemRoutes.signIn)}?_=${new Date().getTime()}&r=${this.getLocalizedURL(moduleConfig.routes.userspace.list.path)}`, 100);
    }

    onDestroy() {
        if (window.__heretic.webSocket) {
            try {
                window.__heretic.webSocket.removeEventListener("message", this.onWebSocketMessage.bind(this));
            } catch {
                // Ignore
            }
        }
    }

    async onLoadComplete(data) {
        if (data && data.total) {
            try {
                const response = await axios({
                    method: "get",
                    url: `/api/${moduleConfig.id}/lock/list`,
                    data: {},
                    headers: this.state.headers,
                });
                if (response.data.lock) {
                    await this.utils.waitForComponent(`${moduleConfig.id}List`);
                    const table = this.getComponent(`${moduleConfig.id}List`);
                    for (const k of Object.keys(response.data.lock)) {
                        table.setLock(k, response.data.lock[k]);
                    }
                }
            } catch (e) {
                // Ignore
            }
        }
    }
};
