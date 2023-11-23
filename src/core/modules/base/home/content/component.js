import axios from "axios";
import axiosRetry from "axios-retry";
import Utils from "#lib/componentUtils";
import Cookies from "#lib/cookiesBrowser";
import pageConfig from "../page.js";
import moduleConfig from "../../module.js";

axiosRetry(axios, {
    retryDelay: axiosRetry.exponentialDelay,
    retries: 10,
});

export default class {
    onCreate(input, out) {
        this.state = {
            ready: !process.browser,
            info: null,
            tab: "info",
            updateId: null,
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
        this.currentToken = this.cookies.get(`${this.siteId}.authToken`);
        if (!this.currentToken) {
            setTimeout(() => window.location.href = `${this.utils.getLocalizedURL(this.systemRoutes.signInAdmin)}`, 100);
            return;
        }
        this.setState("ready", true);
        try {
            const response = await axios({
                method: "get",
                url: `/api/admin/sysInfo`,
                data: {},
                headers: {
                    Authorization: `Bearer ${this.currentToken}`,
                },
                onUploadProgress: () => {}
            });
            this.setState("info", response.data);
        } catch (e) {
            this.setState("ready", false);
            this.setState("failed", true);
        }
    }

    onTabClick(e) {
        const {
            id,
        } = e.target.closest("[data-id]").dataset;
        this.setState("tab", id);
    }

    async onRestartButtonClick(e) {
        e.preventDefault();
        await this.utils.waitForComponent("confirm");
        this.getComponent("confirm").show({
            message: window.__heretic.t("restartConfirmationText"),
            action: "restart",
        });
    }

    async showNotification(message, css = "is-success") {
        await this.utils.waitForComponent("notify");
        this.getComponent("notify").show(window.__heretic.t(message), css);
    }

    async getData() {
        await this.utils.waitForComponent("progress");
        const progressModal = this.getComponent("progress");
        try {
            const formData = new FormData();
            formData.append("id", this.state.updateId);
            const {
                data,
            } = await axios({
                method: "post",
                url: `/api/admin/status`,
                data: formData,
                headers: {
                    Authorization: `Bearer ${this.currentToken}`,
                },
            });
            progressModal.setData({
                message: window.__heretic.t(data.status || "progressUpdating"),
            });
            if (data.status === "processing") {
                setTimeout(() => this.getData(), 1000);
            } else if (data.status === "complete") {
                this.showNotification("processSuccess", "is-success");
                progressModal.setCloseAllowed(true);
                progressModal.hide({});
            }
        } catch {
            this.showNotification("couldNotGetOperationStatus", "is-danger");
            progressModal.setCloseAllowed(true);
                progressModal.hide({});
        }
    }

    async onConfirmed(action) {
        await this.utils.waitForComponent("progress");
        const progressModal = this.getComponent("progress");
        switch (action) {
        case "restart":
            progressModal.setCloseAllowed(false);
            progressModal.show({
                message: window.__heretic.t("progressRestarting"),
            });
            try {
                await axios({
                    method: "get",
                    url: "/api/admin/restart",
                    data: {},
                    headers: {
                        Authorization: `Bearer ${this.currentToken}`,
                    },
                });
                setTimeout(async () => {
                    await this.showNotification("restartSuccess");
                    progressModal.hide({});
                    setTimeout(() => window.location.reload(), 300);
                }, 15000);
            } catch {
                progressModal.setCloseAllowed(true);
                progressModal.hide({});
                this.showNotification("restartError", "is-danger");
            }
            break;
        case "update":
            progressModal.setCloseAllowed(false);
            progressModal.show({
                message: window.__heretic.t("progressUpdating"),
            });
            try {
                const {
                    data: updateData,
                } = await axios({
                    method: "get",
                    url: "/api/admin/update",
                    data: {},
                    headers: {
                        Authorization: `Bearer ${this.currentToken}`,
                    },
                });
                this.setState("updateId", updateData.id);
                this.getData();
            } catch {
                progressModal.setCloseAllowed(true);
                progressModal.hide({});
                this.showNotification("updateError", "is-danger");
            }
            break;
        }
    }

    async onUpdateButtonClick(e) {
        if (!this.state.info.masterPackageJson.version || this.state.info.hereticVersion === this.state.info.masterPackageJson.version) {
            this.showNotification("nothingToDo", "is-warning");
            return;
        }
        e.preventDefault();
        await this.utils.waitForComponent("confirm");
        this.getComponent("confirm").show({
            message: window.__heretic.t("updateConfirmationText"),
            action: "update",
        });
    }
}
