import Utils from "#lib/componentUtils";

export default class {
    onCreate(input, out) {
        this.state = {
            ready: false,
            active: false,
            title: "",
            value: "",
            initialValue: "",
            action: "",
            error: false,
        };
        this.language = out.global.language;
        this.siteTitle = out.global.siteTitle;
        this.siteId = out.global.siteId;
        if (process.browser) {
            window.__heretic = window.__heretic || {};
            window.__heretic.outGlobal =
                window.__heretic.outGlobal || out.global || {};
            this.language =
                this.language || window.__heretic.outGlobal.language;
            this.siteTitle =
                out.global.siteTitle || window.__heretic.outGlobal.siteTitle;
            this.siteId =
                out.global.siteId || window.__heretic.outGlobal.siteId;
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
        this.setState("ready", true);
        window.addEventListener("keydown", this.onKeyDown.bind(this));
    }

    async show(title, value, action) {
        this.setState("title", title);
        this.setState("value", value);
        this.setState("action", action);
        this.setState("error", false);
        this.setState("initialValue", value);
        this.setState("active", true);
        await this.utils.waitForElement("hr_nm_value");
        document.getElementById("hr_nm_value").focus();
    }

    hide() {
        this.setState("active", false);
    }

    onSubmit(e) {
        e.preventDefault();
        const value = this.state.value ? this.state.value.trim() : null;
        // eslint-disable-next-line no-useless-escape
        if (
            !value ||
            value.match(
                /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$|([<>:"\/\\|?*])|(\.|\s)$/gi,
            )
        ) {
            this.setState("error", true);
            this.showNotification("invalidFilename", "is-danger");
            return;
        }
        this.emit("data", {
            id: this.state.initialValue,
            value,
            action: this.state.action,
        });
        this.hide();
    }

    onValueChange(e) {
        this.setState("error", false);
        const { value } = e.target;
        this.setState("value", value.trim());
    }

    onKeyDown(e) {
        if (e.key === "Escape" && this.state.active) {
            e.preventDefault();
            e.stopPropagation();
            this.hide();
        }
    }
}
