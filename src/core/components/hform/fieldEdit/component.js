const IMask = require("imask").default;
const {
    v4: uuidv4
} = require("uuid");
const axios = require("axios").default;
const cloneDeep = require("lodash.clonedeep");
const {
    format,
    parse,
    isValid,
} = require("date-fns");
const Utils = require("../../../lib/componentUtils").default;

module.exports = class {
    onCreate(input) {
        this.state = {
            error: null,
            value: input.value || null,
            captchaLoading: false,
            imageSecret: null,
            calendarVisible: false,
            enumList: [],
        };
        this.maskedInput = null;
    }

    async loadCaptchaData() {
        this.setState("captchaLoading", true);
        try {
            const captchaImageWrap = document.getElementById(`hr_hf_ci_${this.input.formId}_${this.input.id}`);
            captchaImageWrap.innerHTML = "<i/>";
            const {
                data
            } = await axios({
                method: "post",
                url: "/api/captcha",
            });
            captchaImageWrap.innerHTML = data.imageData;
            this.setState("imageSecret", data.imageSecret);
        } catch {
            this.emit("notify", {
                message: "hform_error_captchaLoading",
                css: "is-danger",
            });
        } finally {
            this.setState("captchaLoading", false);
        }
    }

    onUpdate() {
        if (window.__heretic && window.__heretic.setTippy) {
            window.__heretic.setTippy();
        }
    }

    async onMount() {
        this.utils = new Utils(this);
        const element = document.getElementById(`hr_hf_el_${this.input.formId}_${this.input.id}`);
        if (element) {
            switch (this.input.type) {
            case "text":
            case "password":
                this.maskedInput = new IMask(element, this.input.maskedOptions || {
                    mask: /^.+$/
                });
                element.addEventListener("change", this.onInputChangeListener.bind(this));
                break;
            case "textarea":
                element.addEventListener("change", this.onTextareaChangeListener.bind(this));
                break;
            case "date":
                this.maskedInput = new IMask(element, {
                    mask: Date,
                    pattern: window.__heretic.t("global.dateMask.pattern"),
                    format: date => format(date, window.__heretic.t("global.dateFormatShort")),
                    parse: str => parse(str, window.__heretic.t("global.dateFormatShort"), new Date()),
                    lazy: false,
                });
                // element.addEventListener("change", this.onInputChangeListener.bind(this));
                break;
            case "captcha":
                this.maskedInput = new IMask(element, this.input.maskedOptions || {
                    mask: /^(\d){1,4}$/
                });
                element.addEventListener("change", this.onInputChangeListener.bind(this));
                await this.loadCaptchaData();
                break;
            }
        }
        window.addEventListener("click", e => {
            const activeElementId = document.activeElement ? document.activeElement.id : null;
            if (this.state.calendarVisible && document.getElementById(`hr_hf_el_${this.input.formId}_${this.input.id}_calendar_wrap`) && !document.getElementById(`hr_hf_el_${this.input.formId}_${this.input.id}_calendar_wrap`).contains(e.target) && document.getElementById(`hr_hf_el_${this.input.formId}_${this.input.id}_input_wrap`) && !document.getElementById(`hr_hf_el_${this.input.formId}_${this.input.id}_input_wrap`).contains(e.target) && activeElementId !== `hr_hf_el_${this.input.formId}_${this.input.id}`) {
                this.setState("calendarVisible", false);
            }
        });
    }

    onInputChangeListener() {
        this.setState("value", this.maskedInput.unmaskedValue);
        this.emit("value-change", {
            id: this.input.id,
            type: this.input.type,
            value: this.maskedInput.unmaskedValue
        });
    }

    onTextareaChangeListener(e) {
        this.setState("value", e.target.value);
        this.emit("value-change", {
            id: this.input.id,
            type: this.input.type,
            value: e.target.value
        });
    }

    setError(error) {
        this.setState("error", error);
        const element = document.getElementById(`hr_hf_el_${this.input.formId}_${this.input.id}`);
        if (element) {
            element.classList.add("is-danger");
        }
    }

    clearError() {
        this.setState("error", null);
        const element = document.getElementById(`hr_hf_el_${this.input.formId}_${this.input.id}`);
        if (element) {
            element.classList.remove("is-danger");
        }
    }

    focus() {
        const element = document.getElementById(`hr_hf_el_${this.input.formId}_${this.input.id}`);
        if (element) {
            element.focus();
        }
    }

    setLoading(flag) {
        switch (this.input.type) {
        case "text":
        case "textarea":
            const element = document.getElementById(`hr_hf_el_${this.input.formId}_${this.input.id}`);
            if (flag) {
                element.setAttribute("disabled", "");
            } else {
                element.removeAttribute("disabled");
            }
            break;
        case "buttons":
            for (const buttonItem of this.input.items) {
                const buttonElement = document.getElementById(`hr_hf_el_${this.input.formId}_${this.input.id}_${buttonItem.id}`);
                if (flag) {
                    buttonElement.setAttribute("disabled", "");
                } else {
                    buttonElement.removeAttribute("disabled");
                }
            }
            break;
        }
    }

    getValue() {
        let value = null;
        switch (this.input.type) {
        case "text":
            value = typeof this.state.value === "string" && this.state.value.length > 0 ? this.state.value : null;
            break;
        case "password":
            const fieldValue = typeof this.state.value === "string" && this.state.value.length > 0 ? this.state.value : null;
            const passwordRepeatElement = document.getElementById(`hr_hf_el_${this.input.formId}_${this.input.id}_repeat`);
            return {
                value: fieldValue, repeat: passwordRepeatElement ? passwordRepeatElement.value || null : null,
            };

        case "select":
            value = typeof this.state.value === "string" || typeof this.state.value === "number" ? String(this.state.value) : null;
            break;
        case "captcha":
            value = typeof this.state.value === "string" && this.state.value.length > 0 ? `${this.state.value}_${this.state.imageSecret}` : null;
            break;
        default:
            value = this.state.value;
        }
        switch (this.input.convert) {
        case "integer":
            value = parseInt(value, 10) || null;
        }
        return value;
    }

    async setValue(value) {
        switch (this.input.type) {
        case "text":
            if (this.maskedInput) {
                this.maskedInput.unmaskedValue = value === null ? "" : String(value);
            }
            this.setState("value", String(value === null ? "" : value));
            break;
        case "select":
            this.setState("value", String(value === null ? this.input.options[0].value : value));
            break;
        case "date":
            if (this.maskedInput) {
                this.maskedInput.value = value ? format(new Date(value * 1000), window.__heretic.t("global.dateFormatShort")) : "";
            }
            this.setState("value", value || null);
            break;
        case "captcha":
            if (value && typeof value === "string") {
                const [fieldValue, imageSecret] = value.split(/_/);
                if (this.maskedInput) {
                    this.maskedInput.unmaskedValue = String(fieldValue);
                }
                this.setState("value", fieldValue || null);
                this.setState("imageSecret", imageSecret || null);
            }
            break;
        case "wysiwyg":
            await this.utils.waitForComponent(`hr_hf_el_${this.input.formId}_${this.input.id}_wysiwyg`);
            this.getComponent(`hr_hf_el_${this.input.formId}_${this.input.id}_wysiwyg`).setValue(value);
            this.setState("value", value || null);
            break;
        case "keyValue":
            this.setStateDirty("value", value);
            this.forceUpdate();
            break;
        case "textarea":
            await this.utils.waitForElement(`hr_hf_el_${this.input.formId}_${this.input.id}`);
            document.getElementById(`hr_hf_el_${this.input.formId}_${this.input.id}`).value = value;
            this.setState("value", value);
            break;
        default:
            this.setState("value", value);
        }
    }

    onButtonClick(e) {
        if (e.target.dataset.type !== "submit") {
            e.preventDefault();
        }
        this.emit("button-click", {
            id: e.target.dataset.id,
            type: e.target.dataset.type,
        });
    }

    onSelectChange(e) {
        e.preventDefault();
        this.setState("value", String(e.target.value));
        this.emit("value-change", {
            id: this.input.id,
            type: this.input.type,
            value: e.target.value
        });
    }

    onFileInputChange(e) {
        const value = this.input.multiple ? (cloneDeep(this.state.value) || []) : [];
        const files = Array.from(e.target.files);
        for (let i = 0; i < files.length; i += 1) {
            value.push({
                name: files[i].name,
                uid: uuidv4(),
                data: e.target.files[i],
            });
        }
        this.setState("value", value);
        this.emit("value-change", {
            id: this.input.id,
            type: this.input.type,
            value
        });
    }

    onFileInputDeleteClick(e) {
        e.preventDefault();
        const {
            uid
        } = e.target.closest("[data-uid]").dataset;
        const value = cloneDeep(this.state.value).filter(f => f.uid !== uid);
        this.setState("value", value);
        this.emit("value-change", {
            id: this.input.id,
            type: this.input.type,
            value
        });
    }

    onCaptchaImageClick(e) {
        e.preventDefault();
        this.loadCaptchaData();
    }

    onCalendarDateChange(timestamp) {
        this.maskedInput.value = timestamp ? format(new Date(timestamp * 1000), window.__heretic.t("global.dateFormatShort")) : "";
        this.setState("value", timestamp || null);
        this.setState("calendarVisible", false);
        this.emit("value-change", {
            id: this.input.id,
            type: this.input.type,
            value: timestamp || null
        });
    }

    onCalendarInputKeypress() {
        this.setState("calendarVisible", true);
        setTimeout(async () => {
            if (!this.maskedInput.value.match(/_/)) {
                const date = parse(this.maskedInput.value, window.__heretic.t("global.dateFormatShort"), new Date());
                if (isValid(date)) {
                    try {
                        await this.utils.waitForComponent(`hr_hf_el_${this.input.formId}_${this.input.id}_calendar`);
                        this.getComponent(`hr_hf_el_${this.input.formId}_${this.input.id}_calendar`).setDate(date);
                        const dateValue = date.getTime() / 1000;
                        this.setState("value", dateValue);
                        this.emit("value-change", {
                            id: this.input.id,
                            type: this.input.type,
                            value: dateValue
                        });
                    } catch {
                        // Ignore
                    }
                }
            } else {
                this.setState("value", null);
            }
        });
    }

    onCalendarInputKeydown(e) {
        if ((e.which || e.keyCode) === 9) {
            this.setState("calendarVisible", false);
        }
    }

    async onDateInputFocus(e) {
        e.preventDefault();
        this.setState("calendarVisible", true);
        if (this.state.value) {
            await this.utils.waitForComponent(`hr_hf_el_${this.input.formId}_${this.input.id}_calendar`);
            this.getComponent(`hr_hf_el_${this.input.formId}_${this.input.id}_calendar`).setTimestamp(this.state.value * 1000);
        }
    }

    async onWYSIWYGValueChange(value) {
        this.setState("value", value);
        this.emit("value-change", {
            id: this.input.id,
            type: this.input.type,
            value
        });
    }

    async onKeyValueAddClick(e) {
        e.preventDefault();
        this.emit("key-value-add-request", {
            id: this.input.id,
        });
    }

    onKeyValueItemEditClick(e) {
        e.preventDefault();
        const {
            uid,
        } = e.target.closest("[data-uid]").dataset;
        this.emit("key-value-edit-request", {
            id: this.input.id,
            uid,
        });
    }

    onKeyValueItemDeleteClick(e) {
        e.preventDefault();
        const {
            uid,
        } = e.target.closest("[data-uid]").dataset;
        this.emit("key-value-delete-request", {
            id: this.input.id,
            uid,
        });
    }

    onTagsWrapClick() {
        document.getElementById(`hr_hf_el_${this.input.formId}_${this.input.id}`).focus();
    }

    onTagCloseClick(e) {
        e.preventDefault();
        e.stopPropagation();
        const index = parseInt(e.target.dataset.index, 10);
        const tags = cloneDeep(this.state.value || []).filter((t, i) => i !== index);
        this.setState("value", tags);
        this.emit("value-change", {
            id: this.input.id,
            type: this.input.type,
            value: tags
        });
        document.getElementById(`hr_hf_el_${this.input.formId}_${this.input.id}`).focus();
    }

    onTagsInputFocus(e) {
        e.preventDefault();
        const input = document.getElementById(`hr_hf_el_${this.input.formId}_${this.input.id}_wrap`);
        input.className = `${input.className.replace(/(?:^|\s)hr-hf-tags-wrap-focus(?!\S)/gm, "")} hr-hf-tags-wrap-focus`;
    }

    onTagsInputBlur(e) {
        e.preventDefault();
        const input = document.getElementById(`hr_hf_el_${this.input.formId}_${this.input.id}_wrap`);
        input.className = input.className.replace(/(?:^|\s)hr-hf-tags-wrap-focus(?!\S)/gm, "");
    }

    animateErrorField(id) {
        const element = document.getElementById(id);
        if (!element) {
            return;
        }
        element.classList.add("hr-hf-error-bounce");
        setTimeout(() => element.classList.remove("hr-hf-error-bounce"), 1000);
    }

    addTag(id) {
        const tags = cloneDeep(this.state.value || []);
        if (this.input.enumUnique && tags.indexOf(id) > -1) {
            this.animateErrorField(`hr_hf_el_${this.input.formId}_${this.input.id}_wrap`);
            this.input.parentComponent.showNotification(window.__heretic.t("hform_duplicateTag"), "is-warning");
            return;
        }
        if (this.input.minLength && id.length < parseInt(this.input.minLength, 10)) {
            this.animateErrorField(`hr_hf_el_${this.input.formId}_${this.input.id}_wrap`);
            this.input.parentComponent.showNotification(window.__heretic.t("hform_tagTooShort"), "is-warning");
            return;
        }
        if (this.input.maxLength && id.length > parseInt(this.input.maxLength, 10)) {
            this.animateErrorField(`hr_hf_el_${this.input.formId}_${this.input.id}_wrap`);
            this.input.parentComponent.showNotification(window.__heretic.t("hform_tagTooLong"), "is-warning");
            return;
        }
        if (this.input.enumOnly && !this.input.enumValues.find(i => i.id === id)) {
            this.animateErrorField(`hr_hf_el_${this.input.formId}_${this.input.id}_wrap`);
            this.input.parentComponent.showNotification(window.__heretic.t("hform_tagInvalid"), "is-warning");
            return;
        }
        tags.push(id);
        this.setState("value", tags);
        this.emit("value-change", {
            id: this.input.id,
            type: this.input.type,
            value: tags
        });
        this.onTagsInputKeyPress();
    }

    onTagsInputKeyDown(e) {
        const inputField = document.getElementById(`hr_hf_el_${this.input.formId}_${this.input.id}`);
        const value = inputField.value ? inputField.value.trim() : null;
        if (value) {
            if (e.keyCode === 13) {
                e.preventDefault();
                this.addTag(value);
                inputField.value = "";
                return;
            }
        }
        if (e.keyCode === 8) {
            if (!value && this.state.value && this.state.value.length) {
                e.preventDefault();
                const tags = cloneDeep(this.state.value || []).filter((t, i) => i !== (this.state.value || []).length - 1);
                this.setState("value", tags);
                this.emit("value-change", {
                    id: this.input.id,
                    type: this.input.type,
                    value: tags
                });
            }
            if (value) {
                this.onTagsInputKeyPress();
            }
        }
    }

    onTagsInputKeyPress() {
        setTimeout(() => {
            const inputField = document.getElementById(`hr_hf_el_${this.input.formId}_${this.input.id}`);
            const value = inputField.value ? cloneDeep(inputField.value).trim() : null;
            if (this.input.enumValues && value && value.length >= 2) {
                const enumList = this.input.enumValues.filter(i => String(i.id).match(new RegExp(value, "i")) || String(i.label).match(new RegExp(value, "i")));
                this.setState("enumList", enumList);
            } else {
                this.setState("enumList", []);
            }
        });
    }

    onEnumItemClick(e) {
        e.preventDefault();
        const {
            id,
        } = e.target.closest("[data-id]").dataset;
        const inputField = document.getElementById(`hr_hf_el_${this.input.formId}_${this.input.id}`);
        const tags = cloneDeep(this.state.value || []);
        tags.push(id);
        this.setState("value", tags);
        this.emit("value-change", {
            id: this.input.id,
            type: this.input.type,
            value: tags
        });
        inputField.value = "";
        this.onTagsInputKeyPress();
    }

    onTagAddClick(e) {
        e.preventDefault();
        this.emit("tag-add-request", {
            id: this.input.id,
            data: this.input.enumValues,
        });
    }

    async onLogAddClick(e) {
        e.preventDefault();
        this.emit("log-add-request", {
            id: this.input.id,
            options: this.input.options,
            defaultOption: this.input.defaultOption,
        });
    }

    onLogItemEditClick(e) {
        e.preventDefault();
        const {
            uid,
        } = e.target.closest("[data-uid]").dataset;
        this.emit("log-edit-request", {
            id: this.input.id,
            uid,
            options: this.input.options,
            defaultOption: this.input.defaultOption,
        });
    }

    onLogItemDeleteClick(e) {
        e.preventDefault();
        const {
            uid,
        } = e.target.closest("[data-uid]").dataset;
        this.emit("log-delete-request", {
            id: this.input.id,
            uid,
            options: this.input.options,
            defaultOption: this.input.defaultOption,
        });
    }
};
