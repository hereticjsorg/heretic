import Utils from "#lib/componentUtils";

export default class {
    onCreate(input) {
        this.state = {
            error: null,
            value: input.value || null,
        };
    }

    async onMount() {
        this.utils = new Utils(this);
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

    getValue() {
        let value = null;
        switch (this.input.type) {
        case "text":
            value = typeof this.state.value === "string" && this.state.value.length > 0 ? this.state.value : null;
            break;
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

    setValue(value) {
        switch (this.input.type) {
        case "text":
            this.setState("value", String(value === null ? "" : value));
            break;
        case "select":
            this.setState("value", String(value === null ? this.input.options[0].value : value));
            break;
        case "date":
            this.setState("value", value || null);
            break;
        default:
            this.setState("value", value);
        }
    }
}
