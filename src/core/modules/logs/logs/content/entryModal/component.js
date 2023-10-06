import {
    format,
} from "date-fns";
import Utils from "#lib/componentUtils";

export default class {
    onCreate(input, out) {
        this.state = {
            ready: false,
            active: false,
            data: null,
        };
        this.language = out.global.language;
        this.siteTitle = out.global.siteTitle;
        this.siteId = out.global.siteId;
        if (process.browser) {
            window.__heretic = window.__heretic || {};
            window.__heretic.outGlobal = window.__heretic.outGlobal || out.global || {};
            this.language = this.language || window.__heretic.outGlobal.language;
            this.siteTitle = out.global.siteTitle || window.__heretic.outGlobal.siteTitle;
            this.siteId = out.global.siteId || window.__heretic.outGlobal.siteId;
        }
        this.utils = new Utils(this, this.language);
    }

    async showNotification(message, css = "is-success") {
        this.emit("notification", {
            message,
            css,
        });
    }

    onKeyDown(e) {
        if (e.key === "Escape" && this.state.active) {
            e.preventDefault();
            e.stopPropagation();
            this.hide();
        }
    }

    async onMount() {
        this.setState("ready", true);
        window.addEventListener("keydown", this.onKeyDown.bind(this));
    }

    async show(data) {
        this.setState("data", data);
        this.setState("active", true);
    }

    hide() {
        this.setState("active", false);
    }

    processEntry(type, value) {
        switch (type) {
        case "date":
            return value ? format(new Date(value * 1000), `${window.__heretic.t("global.dateFormatShort")} ${window.__heretic.t("global.timeFormatShort")}`) : "—";
        case "type":
            return window.__heretic.t(value);
        case "url":
            return value ? `<a href="${value}" target="_blank">${value}</a>` : "—";
        default:
            return value || "—";
        }
    }
}
