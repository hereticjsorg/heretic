import axios from "axios";
import Utils from "#lib/componentUtils";
import Cookies from "#lib/cookiesBrowser";

export default class {
    onCreate(input, out) {
        this.state = {
            ready: false,
            active: false,
            progress: false,
            status: null,
            mode: null,
            count: null,
            cancelClickCount: 0,
        };
        this.language = out.global.language;
        this.siteTitle = out.global.siteTitle;
        this.siteId = out.global.siteId;
        this.cookieOptions = out.global.cookieOptions;
        if (process.browser) {
            window.__heretic = window.__heretic || {};
            window.__heretic.outGlobal = window.__heretic.outGlobal || out.global || {};
            this.language = this.language || window.__heretic.outGlobal.language;
            this.siteTitle = out.global.siteTitle || window.__heretic.outGlobal.siteTitle;
            this.siteId = out.global.siteId || window.__heretic.outGlobal.siteId;
            this.cookieOptions = out.global.cookieOptions || window.__heretic.outGlobal.cookieOptions;
        }
        this.utils = new Utils(this, this.language);
    }

    async showNotification(message, css = "is-success") {
        this.emit("notification", {
            message,
            css,
        });
    }

    async onMount() {
        this.cookies = new Cookies(this.cookieOptions);
        this.currentToken = this.cookies.get(`${this.siteId}.authToken`);
        this.setState("ready", true);
        window.addEventListener("keydown", this.onKeyDown.bind(this));
    }

    async getData() {
        try {
            const formData = new FormData();
            formData.append("id", this.state.id);
            const {
                data,
            } = await axios({
                method: "post",
                url: `/api/files/status`,
                data: formData,
                headers: {
                    Authorization: `Bearer ${this.currentToken}`,
                },
            });
            this.setState("status", data.status || null);
            this.setState("mode", data.mode || null);
            this.setState("count", data.count || null);
            if (data.status === "processing") {
                setTimeout(() => this.getData(), 1000);
            } else if (data.status === "complete") {
                this.showNotification("processSuccess", "is-success");
                this.hide();
            }
        } catch {
            this.showNotification("couldNotGetOperationStatus", "is-danger");
            this.hide();
        }
    }

    async show(id) {
        this.setState("id", id);
        this.setState("status", null);
        this.setState("active", true);
        this.setState("mode", null);
        this.setState("count", null);
        this.setState("cancelClickCount", 0);
        this.getData();
    }

    hide() {
        if (!this.state.progress) {
            this.setState("active", false);
            this.emit("close");
        }
    }

    onKeyDown(e) {
        if (e.key === "Escape" && this.state.active) {
            e.preventDefault();
            e.stopPropagation();
            this.hide();
        }
    }

    async onCancelClick(e) {
        e.preventDefault();
        if (this.state.cancelClickCount !== 1) {
            this.showNotification("clickCancelAgain", "is-warning");
            this.setState("cancelClickCount", 1);
            return;
        }
        try {
            const formData = new FormData();
            formData.append("id", this.state.id);
            await axios({
                method: "post",
                url: `/api/files/cancel`,
                data: formData,
                headers: {
                    Authorization: `Bearer ${this.currentToken}`,
                },
            });
            this.showNotification("cancellationRequestSent", "is-info");
            this.setState("cancelClickCount", 2);
        } catch {
            this.showNotification("unableToCancel", "is-danger");
        }
    }
}
