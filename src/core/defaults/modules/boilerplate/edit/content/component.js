import axios from "axios";
import Utils from "#lib/componentUtils.js";
import Query from "#lib/queryBrowser.js";
import Cookies from "#lib/cookiesBrowser.js";
import pageConfig from "../page.js";
import moduleConfig from "../../module.js";

export default class {
    async onCreate(input, out) {
        this.state = {
            ready: !process.browser,
            loadingError: false,
        };
        this.language = out.global.language;
        this.siteTitle = out.global.siteTitle;
        this.siteId = out.global.siteId;
        this.cookieOptions = out.global.cookieOptions;
        this.systemRoutes = out.global.systemRoutes;
        if (process.browser) {
            window.__heretic = window.__heretic || {};
            window.__heretic.outGlobal =
                window.__heretic.outGlobal || out.global;
            this.language =
                this.language || window.__heretic.outGlobal.language;
            this.siteTitle =
                out.global.siteTitle || window.__heretic.outGlobal.siteTitle;
            this.siteId =
                out.global.siteId || window.__heretic.outGlobal.siteId;
            this.cookieOptions =
                out.global.cookieOptions ||
                window.__heretic.outGlobal.cookieOptions;
            this.systemRoutes =
                out.global.systemRoutes ||
                window.__heretic.outGlobal.systemRoutes;
            document.title = `${pageConfig.title[this.language]} – ${this.siteTitle}`;
        }
        this.utils = new Utils(this, this.language);
    }

    async loadFormData(id) {
        let formData;
        let access;
        let areas;
        if (id) {
            try {
                const response = await axios({
                    method: "post",
                    url: `/api/${moduleConfig.id}/lock/check`,
                    data: {
                        id,
                    },
                    headers: {
                        Authorization: `Bearer ${this.currentToken}`,
                    },
                });
                if (response.data.lock) {
                    this.setState(
                        "loadingError",
                        `${window.__heretic.t("lockedBy")}: ${response.data.lock.username}`,
                    );
                    return;
                }
            } catch {
                this.setState("loadingError", true);
                return;
            }
            try {
                const response = await axios({
                    method: "post",
                    url: `/api/${moduleConfig.id}/load`,
                    data: {
                        id,
                    },
                    headers: {
                        Authorization: `Bearer ${this.currentToken}`,
                    },
                });
                formData = response.data;
                access = response.data._access;
                areas = response.data._areas;
                this.currentId = id;
            } catch {
                this.setState("loadingError", true);
                return;
            }
        }
        this.setState("ready", true);
        await this.utils.waitForComponent(`${moduleConfig.id}Form`);
        const editForm = this.getComponent(`${moduleConfig.id}Form`);
        if (formData) {
            editForm.deserializeData(formData);
            if (editForm.getMode() === "edit" && this.currentId) {
                this.sendLockAction("lock");
                this.startLockMessaging();
            }
        }
        if (access) {
            editForm.setAccessData(access);
        }
        if (areas) {
            editForm.setAreasData(areas);
        }
        if (id) {
            editForm.setTitle(
                `${window.__heretic.t("editRecord")}: ${formData._default.id}`,
            );
        } else {
            editForm.setTitle(window.__heretic.t("newRecord"));
        }
    }

    async onMount() {
        await this.utils.waitForLanguageData();
        await this.utils.loadLanguageData(moduleConfig.id);
        this.t = window.__heretic.t;
        this.query = new Query();
        this.cookies = new Cookies(this.cookieOptions, this.siteId);
        const id = this.query.get("id");
        this.currentToken = this.cookies.get(`${this.siteId}.authToken`);
        if (!this.currentToken) {
            setTimeout(
                () =>
                    (window.location.href = `${this.getLocalizedURL(this.systemRoutes.signIn)}?r=${this.getLocalizedURL(moduleConfig.routes.userspace.edit.path)}%3Fid%3D${id}`),
                500,
            );
            return;
        }
        await this.loadFormData(id);
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
                    id: this.currentId,
                });
            } catch {
                if (this.socketInterval) {
                    clearInterval(this.socketInterval);
                    this.socketInterval = null;
                }
            }
        }
    }

    startLockMessaging() {
        if (
            window.__heretic.webSocket &&
            this.currentId &&
            !this.socketInterval
        ) {
            this.socketInterval = setInterval(
                () => this.sendLockAction("lock"),
                20000,
            );
        }
    }

    onModeChange(mode) {
        if (mode === "edit" && !this.socketInterval && this.currentId) {
            this.sendLockAction("lock");
            this.startLockMessaging();
        }
    }

    getNonLocalizedURL(url) {
        return this.utils.getNonLocalizedURL(url);
    }

    getLocalizedURL(url) {
        return this.utils.getLocalizedURL(url);
    }

    async submitForm() {
        const editForm = this.getComponent(`${moduleConfig.id}Form`);
        const serializedData = editForm.process();
        if (!serializedData) {
            return;
        }
        const data = new FormData();
        data.append("tabs", `["_default"]`);
        data.append("formTabs", JSON.stringify(serializedData.formTabs));
        data.append("formShared", JSON.stringify(serializedData.formShared));
        if (this.currentId) {
            data.append("id", this.currentId);
        }
        for (const k of Object.keys(serializedData.upload)) {
            data.append(k, serializedData.upload[k]);
        }
        editForm.setErrorMessage(null);
        editForm.setErrors(null);
        editForm.setLoading(true);
        try {
            const submitResult = await axios({
                method: "post",
                url: `/api/${moduleConfig.id}/save`,
                data,
                headers: {
                    Authorization: `Bearer ${this.currentToken}`,
                },
                onUploadProgress: () => {},
            });
            const result = {};
            if (submitResult.data.insertedId) {
                result.insertedId = submitResult.data.insertedId;
            }
            const { id } = submitResult.data;
            editForm.setTitle(`${window.__heretic.t("editRecord")}: ${id}`);
            this.startLockMessaging();
            return result;
        } catch (e) {
            let message;
            if (e && e.response && e.response.data) {
                if (e.response.data.form) {
                    editForm.setErrors(
                        editForm.getErrorData(e.response.data.form),
                    );
                    return;
                }
                if (e.response.data.message) {
                    message = this.t(e.response.data.message);
                }
            }
            editForm.setErrorMessage(message || this.t("hform_error_general"));
        } finally {
            editForm.setLoading(false);
        }
        return false;
    }

    onButtonClick(btn) {
        switch (btn.id) {
            case "close":
                const queryStore = this.query.getStore();
                delete queryStore.id;
                window.__heretic.router.navigate(
                    `${moduleConfig.id}_list`,
                    this.language,
                    queryStore,
                );
                break;
            default:
                this.saveClose = btn.id === "saveClose";
        }
    }

    async onFormSubmit() {
        const submitResult = await this.submitForm();
        if (!submitResult) {
            return;
        }
        if (this.saveClose) {
            const queryStore = this.query.getStore();
            delete queryStore.id;
            window.__heretic.router.navigate(
                `${moduleConfig.id}_list`,
                this.language,
                queryStore,
                {
                    success: true,
                },
            );
        } else {
            await this.utils.waitForComponent(`notify_${moduleConfig.id}Edit`);
            this.getComponent(`notify_${moduleConfig.id}Edit`).show(
                window.__heretic.t("saveSuccess"),
                "is-success",
            );
            if (submitResult.insertedId) {
                this.currentId = submitResult.insertedId;
                this.query.set("id", submitResult.insertedId);
                this.sendLockAction("lock");
                this.startLockMessaging();
            }
        }
    }

    async loadHistory(editForm, data) {
        const result = await axios({
            method: "post",
            url: `/api/${moduleConfig.id}/history/list`,
            data: {
                id: this.currentId,
                page: data.page ? parseInt(data.page, 10) : 1,
            },
            headers: {
                Authorization: `Bearer ${this.currentToken}`,
            },
            onUploadProgress: () => {},
        });
        editForm.setHistoryData({
            items: result.data.items,
            total: result.data.total,
            itemsPerPage: result.data.itemsPerPage || 30,
            page: data && data.page ? parseInt(data.page, 10) : 1,
        });
    }

    async onRequestHistory(data) {
        if (!this.currentId) {
            return;
        }
        await this.utils.waitForComponent(`${moduleConfig.id}Form`);
        const editForm = this.getComponent(`${moduleConfig.id}Form`);
        editForm.setLoading(true);
        try {
            await this.loadHistory(editForm, data);
        } catch (e) {
            await this.utils.waitForComponent(`notify_${moduleConfig.id}Edit`);
            this.getComponent(`notify_${moduleConfig.id}Edit`).show(
                this.t("hform_error_history"),
                "is-danger",
            );
        } finally {
            editForm.setLoading(false);
            editForm.setHistoryModalLoading(false);
        }
    }

    async onRestoreHistory(id) {
        await this.utils.waitForComponent(`${moduleConfig.id}Form`);
        await this.utils.waitForComponent(`notify_${moduleConfig.id}Edit`);
        const editForm = this.getComponent(`${moduleConfig.id}Form`);
        const notificationComponent = this.getComponent(
            `notify_${moduleConfig.id}Edit`,
        );
        await editForm.setHistoryModalLoading(true);
        try {
            await axios({
                method: "post",
                url: `/api/${moduleConfig.id}/history/restore`,
                data: {
                    id,
                },
                headers: {
                    Authorization: `Bearer ${this.currentToken}`,
                },
                onUploadProgress: () => {},
            });
            notificationComponent.show(
                window.__heretic.t("hform_historyRestoreSuccess"),
                "is-success",
            );
            await editForm.setHistoryModalActive(false);
            await this.loadFormData(this.currentId);
        } catch {
            notificationComponent.show(
                window.__heretic.t("hform_historyRestoreError"),
                "is-danger",
            );
        } finally {
            await editForm.setHistoryModalLoading(false);
        }
    }

    async onDeleteHistory(id) {
        await this.utils.waitForComponent(`${moduleConfig.id}Form`);
        await this.utils.waitForComponent(`notify_${moduleConfig.id}Edit`);
        const editForm = this.getComponent(`${moduleConfig.id}Form`);
        const notificationComponent = this.getComponent(
            `notify_${moduleConfig.id}Edit`,
        );
        await editForm.setHistoryModalLoading(true);
        try {
            await axios({
                method: "post",
                url: `/api/${moduleConfig.id}/history/delete`,
                data: {
                    ids: [id],
                },
                headers: {
                    Authorization: `Bearer ${this.currentToken}`,
                },
                onUploadProgress: () => {},
            });
            notificationComponent.show(
                window.__heretic.t("hform_historyDeleteSuccess"),
                "is-success",
            );
            await this.loadHistory(editForm, {
                page: 1,
            });
        } catch {
            notificationComponent.show(
                window.__heretic.t("hform_historyDeleteError"),
                "is-danger",
            );
        } finally {
            await editForm.setHistoryModalLoading(false);
        }
    }

    onDestroy() {
        this.sendLockAction("unlock");
    }

    onFormValueChange() {
        // You may wish to handle this event
    }
}
