const {
    mdiFormatBold,
    mdiFormatItalic,
    mdiFormatUnderline,
    mdiFormatStrikethrough,
    mdiFormatHeader1,
    mdiFormatHeader2,
    mdiFormatParagraph,
    mdiFormatQuoteClose,
    mdiFormatListBulleted,
    mdiFormatListNumbered,
    mdiMinus,
} = require("@mdi/js");
const Utils = require("../../lib/componentUtils").default;

module.exports = class {
    onCreate() {
        this.state = {};
        this.maskedInput = null;
    }

    getActionState(action) {
        return document.queryCommandState(action);
    }

    actionStateHandler() {
        this.editor.focus();
        Object.keys(this.actions).map(a => {
            const action = this.actions[a];
            if (action.state) {
                const state = this.getActionState(a);
                document.getElementById(`hr_wy_el_${this.input.formId}_${this.input.id}_control_${a}`).classList[state ? "add" : "remove"]("hr-wy-control-button-selected");
            }
        });
    }

    onControlClick(e) {
        e.preventDefault();
        if (!e.target.closest("[data-action]")) {
            return;
        }
        const {
            action,
        } = e.target.closest("[data-action]").dataset;
        this.editor.focus();
        switch (action) {
        case "heading1":
            document.execCommand("formatBlock", false, "<h1>");
            break;
        case "heading2":
            document.execCommand("formatBlock", false, "<h1>");
            break;
        case "paragraph":
            document.execCommand("formatBlock", false, "<p>");
            break;
        default:
            document.execCommand(action, false, null);
        }
        this.actionStateHandler();
    }

    onEditorInput({
        target: {
            firstChild,
        }
    }) {
        if (firstChild && firstChild.nodeType === 3) {
            document.execCommand("formatBlock", false, `<${this.paragraphSeparator}>`);
        } else if (this.editor.innerHTML === "<br>") {
            this.editor.innerHTML = "";
        }
        console.log(this.editor.innerHTML);
    }

    onEditorKeydown(e) {
        if (e.key === "Enter" && document.queryCommandValue("formatBlock)") === "blockquote") {
            setTimeout(() => document.execCommand("formatBlock", false, `<${this.paragraphSeparator}>`), 0);
        }
    }

    async onMount() {
        this.utils = new Utils(this);
        this.paragraphSeparator = "div";
        this.actions = {
            bold: {
                icon: mdiFormatBold,
                title: window.__heretic.t("hwysiwyg_bold"),
                state: true,
            },
            italic: {
                icon: mdiFormatItalic,
                title: window.__heretic.t("hwysiwyg_italic"),
                state: true,
            },
            underline: {
                icon: mdiFormatUnderline,
                title: window.__heretic.t("hwysiwyg_underline"),
                state: true,
            },
            strikethrough: {
                icon: mdiFormatStrikethrough,
                title: window.__heretic.t("hwysiwyg_strikethrough"),
                state: true,
            },
            _s1: {
                separator: true,
            },
            heading1: {
                icon: mdiFormatHeader1,
                title: window.__heretic.t("hwysiwyg_heading1")
            },
            heading2: {
                icon: mdiFormatHeader2,
                title: window.__heretic.t("hwysiwyg_heading2")
            },
            _s2: {
                separator: true,
            },
            paragraph: {
                icon: mdiFormatParagraph,
                title: window.__heretic.t("hwysiwyg_paragraph")
            },
        };
        await this.utils.waitForElement(`hr_wy_el_${this.input.formId}_${this.input.id}`);
        this.editor = document.getElementById(`hr_wy_el_${this.input.formId}_${this.input.id}`);
        this.editor.contentEditable = "true";
        const controls = document.getElementById(`hr_wy_el_${this.input.formId}_${this.input.id}_controls`);
        for (const a of Object.keys(this.actions)) {
            const action = this.actions[a];
            if (action.separator) {
                const separator = document.createElement("div");
                separator.style.width = "5px";
                separator.style.display = "inline-block";
                controls.appendChild(separator);
            } else {
                const button = document.createElement("button");
                button.id = `hr_wy_el_${this.input.formId}_${this.input.id}_control_${a}`;
                button.classList.add("button");
                button.classList.add("hr-wy-control-button");
                button.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="${action.icon}"/></svg>`;
                button.type = "button";
                button.dataset.action = a;
                controls.appendChild(button);
            }
        }
        controls.addEventListener("click", this.onControlClick.bind(this));
        this.editor.addEventListener("keyup", this.actionStateHandler.bind(this));
        this.editor.addEventListener("mouseup", this.actionStateHandler.bind(this));
        this.editor.addEventListener("input", this.onEditorInput.bind(this));
        this.editor.addEventListener("keydown", this.onEditorKeydown.bind(this));
    }
};
