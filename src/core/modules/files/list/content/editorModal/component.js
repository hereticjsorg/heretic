import ace from "#lib/aceEditor";
import Utils from "#lib/componentUtils";

export default class {
    onCreate(input, out) {
        this.state = {
            ready: false,
            active: false,
            filename: null,
            content: null,
            mime: null,
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

    async onMount() {
        this.setState("ready", true);
        await this.utils.waitForElement("hr_em_editor");
        this.editor = ace.edit("hr_em_editor");
        this.editor.setOptions({
            fontSize: "14px",
            wrap: true,
            useSoftTabs: true,
            tabSize: 2
        });
        window.addEventListener("keydown", this.onKeyDown.bind(this));
        window.addEventListener("scroll", () => document.documentElement.style.setProperty("--scroll-y", `${window.scrollY}px`));
    }

    onKeyDown(e) {
        if (e.key === "Escape" && this.state.active) {
            e.preventDefault();
            e.stopPropagation();
            this.hide();
        }
    }

    async show(filename, content = null, mime = null) {
        this.setState("filename", filename);
        this.setState("mime", mime);
        const scrollY = document.documentElement.style.getPropertyValue("--scroll-y");
        document.body.style.position = "fixed";
        document.body.style.top = `-${scrollY}`;
        const aceOptions = {
            theme: document.documentElement.classList.contains("theme-dark") ? "ace/theme/ambiance" : "ace/theme/chrome",
        };
        switch (mime) {
        case "text/html":
            aceOptions.mode = "ace/mode/html";
            break;
        case "application/javascript":
        case "text/css":
            aceOptions.mode = "ace/mode/javascript";
            break;
        case "application/json":
            aceOptions.mode = "ace/mode/json";
            break;
        case "text/markdown":
            aceOptions.mode = "ace/mode/markdown";
            break;
        default:
            aceOptions.mode = "ace/mode/text";
        }
        this.editor.setOptions(aceOptions);
        this.editor.setValue(content || "", -1);
        this.setState("active", true);
        setTimeout(() => this.editor.focus(), 100);
    }

    hide() {
        const scrollY = document.body.style.top;
        document.body.style.position = "";
        document.body.style.top = "";
        window.scrollTo(0, parseInt(scrollY || "0", 10) * -1);
        this.setState("active", false);
        this.emit("hide");
    }

    onSubmit() {
        this.emit("save", {
            filename: this.state.filename,
            content: this.editor.getValue(),
        });
        this.hide();
    }
}
