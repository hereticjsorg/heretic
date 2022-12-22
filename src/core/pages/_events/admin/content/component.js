const axios = require("axios").default;
const {
    format,
} = require("date-fns");
const Utils = require("../../../../lib/componentUtils").default;
const Query = require("../../../../lib/queryBrowser").default;
const Cookies = require("../../../../lib/cookiesBrowser").default;
const moduleConfig = require("../../admin.js");

module.exports = class {
    onCreate(input, out) {
        this.state = {
            ready: !process.browser,
            failed: false,
            headers: {},
            eventTitle: null,
            eventDateTime: null,
            eventIp: null,
            eventUsername: null,
            eventExtras: null,
        };
        this.language = out.global.language;
        this.siteTitle = out.global.siteTitle;
        this.siteId = out.global.siteId;
        this.cookieOptions = out.global.cookieOptions;
        this.systemRoutes = out.global.systemRoutes;
        this.authOptions = out.global.authOptions;
        this.mongoEnabled = out.global.mongoEnabled;
        if (process.browser && window.__heretic && window.__heretic.t) {
            this.authOptions = this.authOptions || window.__heretic.outGlobal.authOptions;
            this.mongoEnabled = this.mongoEnabled || window.__heretic.outGlobal.mongoEnabled;
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
        if (!this.mongoEnabled) {
            return;
        }
        this.t = window.__heretic.t;
        this.query = new Query();
        this.cookies = new Cookies(this.cookieOptions);
        const currentToken = this.cookies.get(`${this.siteId}.authToken`);
        if (!currentToken) {
            setTimeout(() => window.location.href = this.utils.getLocalizedURL(this.systemRoutes.signInAdmin), 100);
            return;
        }
        this.setState("headers", {
            Authorization: `Bearer ${currentToken}`
        });
        try {
            const {
                data,
            } = await axios({
                method: "get",
                headers: this.state.headers,
                url: `/api/dataProviders/groups?language=${this.language}`,
            });
            this.providerDataGroups = data.data;
        } catch (e) {
            this.setState("failed", true);
            return;
        }
        try {
            const {
                data,
            } = await axios({
                method: "get",
                headers: this.state.headers,
                url: `/api/dataProviders/events?language=${this.language}`,
            });
            this.providerDataEvents = data.data;
        } catch (e) {
            this.setState("failed", true);
            return;
        }
        this.setState("ready", true);
        if (window.__heretic.webSocket) {
            window.__heretic.webSocket.addEventListener("message", this.onWebSocketMessage.bind(this));
        }
        await this.utils.waitForComponent(`${moduleConfig.id}List`);
        const table = this.getComponent(`${moduleConfig.id}List`);
        const formData = table.getFormData();
        formData.setProviderDataEvents(this.providerDataEvents);
    }

    onTopButtonClick() {}

    async onActionButtonClick(data) {
        switch (data.buttonId) {
        case "view":
            await this.utils.waitForComponent(`${moduleConfig.id}List`);
            const table = this.getComponent(`${moduleConfig.id}List`);
            table.setLoading(true);
            let responseData;
            try {
                const response = await axios({
                    method: "post",
                    url: `/api/${moduleConfig.id}/load`,
                    data: {
                        id: data.itemId,
                        language: this.language,
                    },
                    headers: this.state.headers,
                });
                responseData = response.data._default;
            } catch {
                this.getComponent(`notify_${moduleConfig.id}List`).show(window.__heretic.t("loadingError"), "is-danger");
                return;
            } finally {
                table.setLoading(false);
            }
            await this.utils.waitForComponent(`${moduleConfig.id}EditModal`);
            const modalDialog = await this.getComponent(`${moduleConfig.id}EditModal`);
            modalDialog.setTitle(this.t("viewEvent"));
            this.setState("eventTitle", this.providerDataEvents[responseData.event] || responseData.event);
            this.setState("eventDateTime", format(new Date(responseData.date * 1000), `${this.t("global.dateFormatShort")} ${this.t("global.timeFormatShort")}`));
            this.setState("eventLocation", responseData.location);
            this.setState("eventUsername", responseData.username);
            this.setState("eventExtras", responseData.extras);
            modalDialog.setActive(true).setCloseAllowed(true).setLoading(false);
            this.setState("eventIp", responseData.ip);
            break;
        }
    }

    onFormMountComplete() {}

    onUnauthorized() {
        this.setState("ready", false);
        setTimeout(() => window.location.href = this.utils.getLocalizedURL(this.systemRoutes.signInAdmin), 100);
    }

    onFormSubmit() {
        this.formSave();
    }

    async onModalButtonClick(button) {
        switch (button) {
        case "save":
            await this.formSave();
            break;
        }
    }
};
