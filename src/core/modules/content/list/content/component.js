// import axios from "axios";
import Utils from "#lib/componentUtils";
import Query from "#lib/queryBrowser";
import Cookies from "#lib/cookiesBrowser";
import moduleConfig from "../../module.js";
import pageConfig from "../page.js";

export default class {
    onCreate(input, out) {
        this.state = {
            ready: !process.browser,
            headers: {},
            currentId: null,
            failed: false,
        };
        this.language = out.global.language;
        this.siteTitle = out.global.siteTitle;
        this.siteId = out.global.siteId;
        this.cookieOptions = out.global.cookieOptions;
        this.systemRoutes = out.global.systemRoutes;
        this.authOptions = out.global.authOptions;
        this.mongoEnabled = out.global.mongoEnabled;
        if (process.browser) {
            window.__heretic = window.__heretic || {};
            window.__heretic.outGlobal = window.__heretic.outGlobal || out.global;
            this.authOptions = this.authOptions || window.__heretic.outGlobal.authOptions;
            this.mongoEnabled = this.mongoEnabled || window.__heretic.outGlobal.mongoEnabled;
            this.language = this.language || window.__heretic.outGlobal.language;
            this.siteTitle = out.global.siteTitle || window.__heretic.outGlobal.siteTitle;
            this.siteId = out.global.siteId || window.__heretic.outGlobal.siteId;
            this.cookieOptions = out.global.cookieOptions || window.__heretic.outGlobal.cookieOptions;
            this.systemRoutes = out.global.systemRoutes || window.__heretic.outGlobal.systemRoutes;
            document.title = `${pageConfig.title[this.language]} – ${this.siteTitle}`;
        }
        this.utils = new Utils(this, this.language);
    }

    async onWebSocketMessage(e) {
        if (e && e.data && e.isTrusted) {
            try {
                const data = JSON.parse(e.data);
                await this.utils.waitForComponent(`${pageConfig.id}List`);
                const table = this.getComponent(`${pageConfig.id}List`);
                table.setLock(data.id, data.action === "locked" ? data.username : null);
            } catch {
                // Ignore
            }
        }
    }

    async onMount() {
        await this.utils.waitForLanguageData();
        await this.utils.loadLanguageData(moduleConfig.id);
        if (!this.mongoEnabled) {
            return;
        }
        this.t = window.__heretic.t;
        this.query = new Query();
        this.cookies = new Cookies(this.cookieOptions, this.siteId);
        const currentToken = this.cookies.get(`${this.siteId}.authToken`);
        if (!currentToken) {
            setTimeout(() => window.location.href = `${this.utils.getLocalizedURL(this.systemRoutes.signInAdmin)}`, 100);
            return;
        }
        const headers = {
            Authorization: `Bearer ${currentToken}`
        };
        this.setState("headers", headers);
        this.setState("ready", true);
        if (window.__heretic.webSocket) {
            window.__heretic.webSocket.addEventListener("message", this.onWebSocketMessage.bind(this));
        }
    }

    async onTopButtonClick(id) {
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
        switch (data.buttonId) {
        case "edit":
            await this.utils.waitForComponent(`${pageConfig.id}List`);
            const table = this.getComponent(`${pageConfig.id}List`);
            table.setLoading(true);
            this.setState("currentId", data.itemId);
            break;
        }
    }

    async onFormMountComplete() {
        //
    }

    onUnauthorized() {
        this.setState("ready", false);
        setTimeout(() => window.location.href = this.utils.getLocalizedURL(this.systemRoutes.signInAdmin), 100);
    }

    onFormSubmit() {
        //
    }

    async onSaveSuccess() {
        this.getComponent(`notify_${pageConfig.id}List`).show(window.__heretic.t("saveSuccess"), "is-success");
    }

    sendLockAction(action) {
        if (this.socketInterval && action === "unlock") {
            clearInterval(this.socketInterval);
            this.socketInterval = null;
        }
        if (window.__heretic.webSocket) {
            try {
                window.__heretic.webSocket.sendMessage({
                    module: pageConfig.id,
                    action,
                    id: this.state.currentId,
                });
            } catch (e) {
                if (this.socketInterval) {
                    clearInterval(this.socketInterval);
                    this.socketInterval = null;
                }
            }
        }
    }

    startLockMessaging() {
        if (window.__heretic.webSocket && this.state.currentId && !this.socketInterval) {
            this.socketInterval = setInterval(() => this.sendLockAction("lock"), 20000);
        }
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

    async onLoadComplete() {
        //
    }
}
