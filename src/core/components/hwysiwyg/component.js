const Utils = require("../../lib/componentUtils").default;
const icons = require("./icons.json");

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
        case "blockquote":
            document.execCommand("formatBlock", false, "<blockquote>");
            break;
        case "orderedList":
            document.execCommand("insertOrderedList", false, null);
            break;
        case "unorderedList":
            document.execCommand("insertUnorderedList", false, null);
            break;
        case "line":
            document.execCommand("insertHorizontalRule", false, null);
            break;
        case "code":
            document.execCommand("formatBlock", false, "<pre>");
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
        setTimeout(() => this.emit("value-change", this.editor.innerHTML), 0);
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
                icon: icons.formatBold,
                title: window.__heretic.t("hwysiwyg_bold"),
                state: true,
            },
            italic: {
                icon: icons.formatItalic,
                title: window.__heretic.t("hwysiwyg_italic"),
                state: true,
            },
            underline: {
                icon: icons.formatUnderline,
                title: window.__heretic.t("hwysiwyg_underline"),
                state: true,
            },
            strikethrough: {
                icon: icons.formatStrikethrough,
                title: window.__heretic.t("hwysiwyg_strikethrough"),
                state: true,
            },
            _s1: {
                separator: true,
            },
            heading1: {
                icon: icons.formatHeading1,
                title: window.__heretic.t("hwysiwyg_heading1")
            },
            heading2: {
                icon: icons.formatHeading2,
                title: window.__heretic.t("hwysiwyg_heading2")
            },
            _s2: {
                separator: true,
            },
            paragraph: {
                icon: icons.formatParagraph,
                title: window.__heretic.t("hwysiwyg_paragraph")
            },
            blockquote: {
                icon: icons.formatBlockquote,
                title: window.__heretic.t("hwysiwyg_blockquote")
            },
            orderedList: {
                icon: icons.formatOrderedList,
                title: window.__heretic.t("hwysiwyg_orderedList")
            },
            unorderedList: {
                icon: icons.formatUnorderedList,
                title: window.__heretic.t("hwysiwyg_unorderedList")
            },
            line: {
                icon: icons.formatLine,
                title: window.__heretic.t("hwysiwyg_line")
            },
            code: {
                icon: icons.formatCode,
                title: window.__heretic.t("hwysiwyg_code")
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
                // button.classList.add("button");
                button.classList.add("hr-wy-control-button");
                button.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path d="${action.icon}"/></svg>`;
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

    setValue(value) {
        this.editor.innerHTML = value;
    }

    getValue() {
        return this.editor.innerHTML;
    }
};
