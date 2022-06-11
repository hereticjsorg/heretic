const IMask = require("imask").default;
const {
    v4: uuidv4
} = require("uuid");
const cloneDeep = require("lodash.clonedeep");

module.exports = class {
    onCreate(input) {
        this.state = {
            error: null,
            value: input.value || null,
        };
        this.maskedInput = null;
    }

    onMount() {
        const element = document.getElementById(`hr_hf_el_${this.input.formId}_${this.input.id}`);
        if (element) {
            switch (this.input.type) {
            case "text":
                this.maskedInput = new IMask(element, this.input.maskedOptions || {
                    mask: /^.+$/
                });
                element.addEventListener("change", this.onInputChangeListener.bind(this));
                break;
            }
        }
    }

    onInputChangeListener() {
        this.setState("value", this.maskedInput.unmaskedValue);
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
        case "select":
            value = typeof this.state.value === "string" || typeof this.state.value === "number" ? String(this.state.value) : null;
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

    setValue(value) {
        switch (this.input.type) {
        case "text":
            if (this.maskedInput) {
                this.maskedInput.unmaskedValue = value === null ? "" : String(value);
            }
            this.setState("value", String(value === null ? "" : value));
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
    }

    onFileInputDeleteClick(e) {
        e.preventDefault();
        const {
            uid
        } = e.target.closest("[data-uid]").dataset;
        this.setState("value", cloneDeep(this.state.value).filter(f => f.uid !== uid));
    }
};
