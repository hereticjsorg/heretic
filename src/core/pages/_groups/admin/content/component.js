const axios = require("axios").default;
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
            currentId: null,
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

    async formSave() {
        await this.utils.waitForComponent(`${moduleConfig.id}Form`);
        const form = this.getComponent(`${moduleConfig.id}Form`);
        const serializedData = form.process();
        if (!serializedData) {
            return;
        }
        const data = new FormData();
        data.append("tabs", `["_default"]`);
        data.append("formTabs", JSON.stringify(serializedData.formTabs));
        data.append("formShared", JSON.stringify(serializedData.formShared));
        if (this.state.currentId) {
            data.append("id", this.state.currentId);
        }
        for (const k of Object.keys(serializedData.upload)) {
            data.append(k, serializedData.upload[k]);
        }
        await this.utils.waitForComponent(`${moduleConfig.id}EditModal`);
        const editModal = this.getComponent(`${moduleConfig.id}EditModal`);
        editModal.setLoading(true).setCloseAllowed(false);
        try {
            await axios({
                method: "post",
                url: `/api/${moduleConfig.id}/save`,
                data,
                headers: this.state.headers,
                onUploadProgress: () => {}
            });
            this.onSaveSuccess();
        } catch (e) {
            let message;
            if (e && e.response && e.response.data) {
                if (e.response.data.message) {
                    message = this.t(e.response.data.message);
                }
                if (e.response.data.form) {
                    form.setErrors(form.getErrorData(e.response.data.form));
                    if (message) {
                        form.setErrorMessage(message);
                    }
                    return;
                }
            }
            form.setErrorMessage(message || this.t("hform_error_general"));
        } finally {
            editModal.setLoading(false).setCloseAllowed(true);
        }
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
            this.providerData = data.data;
        } catch (e) {
            this.setState("failed", true);
            return;
        }
        this.setState("ready", true);
        if (window.__heretic.webSocket) {
            window.__heretic.webSocket.addEventListener("message", this.onWebSocketMessage.bind(this));
        }
    }

    async onTopButtonClick(id) {
        switch (id) {
        case "newItem":
            this.setState("currentId", null);
            await this.utils.waitForComponent(`${moduleConfig.id}EditModal`);
            const modalDialog = await this.getComponent(`${moduleConfig.id}EditModal`);
            modalDialog.setTitle(this.t("newRecord"));
            modalDialog.setActive(true).setCloseAllowed(true).setBackgroundCloseAllowed(false).setLoading(false);
            await this.utils.waitForComponent(`${moduleConfig.id}Form`);
            const form = this.getComponent(`${moduleConfig.id}Form`);
            form.setKeyValueData(this.providerData);
            break;
        }
    }

    async onActionButtonClick(data) {
        switch (data.buttonId) {
        case "edit":
            await this.utils.waitForComponent(`${moduleConfig.id}List`);
            const table = this.getComponent(`${moduleConfig.id}List`);
            table.setLoading(true);
            let responseData;
            try {
                try {
                    const response = await axios({
                        method: "post",
                        url: `/api/${moduleConfig.id}/lock/check`,
                        data: {
                            id: data.itemId,
                        },
                        headers: this.state.headers,
                    });
                    if (response.data.lock) {
                        this.getComponent(`notify_${moduleConfig.id}List`).show(`${window.__heretic.t("lockedBy")}: ${response.data.lock.username}`, "is-danger");
                        return;
                    }
                } catch {
                    this.getComponent(`notify_${moduleConfig.id}List`).show(window.__heretic.t("couldNotLoadLockData"), "is-danger");
                    return;
                }
                const response = await axios({
                    method: "post",
                    url: `/api/${moduleConfig.id}/load`,
                    data: {
                        id: data.itemId,
                    },
                    headers: this.state.headers,
                });
                responseData = response.data;
            } catch {
                this.getComponent(`notify_${moduleConfig.id}List`).show(window.__heretic.t("loadingError"), "is-danger");
                return;
            } finally {
                table.setLoading(false);
            }
            this.setState("currentId", data.itemId);
            await this.utils.waitForComponent(`${moduleConfig.id}EditModal`);
            const modalDialog = await this.getComponent(`${moduleConfig.id}EditModal`);
            modalDialog.setTitle(this.t("editRecord"));
            modalDialog.setActive(true).setCloseAllowed(true).setBackgroundCloseAllowed(false).setLoading(false);
            await this.utils.waitForComponent(`${moduleConfig.id}Form`);
            const form = this.getComponent(`${moduleConfig.id}Form`);
            form.setKeyValueData(this.providerData);
            await form.deserializeView(responseData._default);
            this.sendLockAction("lock");
            this.startLockMessaging();
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

    async onSaveSuccess() {
        await this.utils.waitForComponent(`${moduleConfig.id}EditModal`);
        const modal = await this.getComponent(`${moduleConfig.id}EditModal`);
        modal.setActive(false);
        await this.utils.waitForComponent(`${moduleConfig.id}List`);
        const table = this.getComponent(`${moduleConfig.id}List`);
        await table.loadData();
        this.getComponent(`notify_${moduleConfig.id}List`).show(window.__heretic.t("saveSuccess"), "is-success");
        if (this.state.currentId) {
            this.sendLockAction("unlock");
            this.setState("currentId", null);
        }
    }

    async onModalButtonClick(button) {
        switch (button) {
        case "save":
            await this.formSave();
            break;
        }
    }

    sendLockAction(action) {
        if (this.socketInterval && action === "unlock") {
            clearInterval(this.socketInterval);
            this.socketInterval = null;
        }
        if (window.__heretic.webSocket) {
            try {
                window.__heretic.webSocket.sendMessage({
                    module: moduleConfig.id,
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

    onEditModalClose() {
        if (this.state.currentId) {
            this.sendLockAction("unlock");
        }
    }
};
