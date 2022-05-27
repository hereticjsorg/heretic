const Ajv = require("ajv");
const serializableTypes = require("./serializableTypes.json");

module.exports = class {
    onCreate(input) {
        this.state = {
            loading: false,
        };
        const ajv = new Ajv({
            allErrors: true
        });
        if (input.validationSchema) {
            this.validateSchema = ajv.compile(input.validationSchema);
        }
        this.fieldIds = [];
        this.fieldsFlat = {};
        // Collect field IDs
        for (const area of input.data) {
            for (const item of area.fields) {
                if (Array.isArray(item)) {
                    for (const subItem of item) {
                        this.fieldIds.push(subItem.id);
                        this.fieldsFlat[subItem.id] = subItem;
                    }
                } else {
                    this.fieldIds.push(item.id);
                    this.fieldsFlat[item.id] = item;
                }
            }
        }
    }

    onMount() {
        for (const area of this.input.data) {
            for (const field of area.fields) {
                if (field.autoFocus) {
                    const component = this.getComponent(`hr_hf_f_${field.id}`);
                    if (component && component.focus) {
                        component.focus();
                    }
                }
            }
        }
        for (const id of this.fieldIds) {
            if (this.fieldsFlat[id].defaultValue) {
                this.setValue(id, this.fieldsFlat[id].defaultValue);
            } else if (this.fieldsFlat[id].type === "select") {
                this.setValue(id, this.fieldsFlat[id].options[0].value);
            }
        }
    }

    serialize() {
        const data = {};
        // Get data for each field
        for (const id of this.fieldIds) {
            if (serializableTypes.indexOf(this.fieldsFlat[id].type) > -1) {
                const fieldComponent = this.getComponent(`hr_hf_f_${id}`);
                if (fieldComponent) {
                    data[id] = fieldComponent.getValue();
                }
            }
        }
        return data;
    }

    validate(data) {
        if (this.validateSchema) {
            const result = this.validateSchema(data);
            if (!result) {
                return this.validateSchema.errors;
            }
        }
        return null;
    }

    getErrorData(validationResult) {
        if (!validationResult || !(Symbol.iterator in Object(validationResult))) {
            return {};
        }
        const errorData = [];
        for (const item of validationResult) {
            const instanceArr = item.instancePath.split(/\//);
            const id = instanceArr[instanceArr.length - 1];
            let errorCode = null;
            switch (item.keyword) {
            case "type":
                errorCode = "hform_error_type";
                break;
            case "maximum":
                errorCode = "hform_error_max";
                break;
            case "minLength":
                errorCode = "hform_error_minLength";
                break;
            case "maxLength":
                errorCode = "hform_error_maxLength";
                break;
            case "pattern":
            case "format":
            case "anyOf":
            case "enum":
                errorCode = "hform_error_format";
                break;
            default:
                errorCode = "hform_error_generic";
            }
            errorData.push({
                id,
                errorCode,
                errorMessage: window.__heretic.t(errorCode),
            });
        }
        return errorData;
    }

    setValue(id, value) {
        const fieldComponent = this.getComponent(`hr_hf_f_${id}`);
        if (fieldComponent) {
            fieldComponent.setValue(value);
        }
    }

    getValue(id) {
        const fieldComponent = this.getComponent(`hr_hf_f_${id}`);
        if (fieldComponent) {
            return fieldComponent.getValue();
        }
        return null;
    }

    setErrors(errorData) {
        if (!errorData || !(Symbol.iterator in Object(errorData))) {
            return;
        }
        let focused = false;
        for (const item of errorData) {
            const fieldComponent = this.getComponent(`hr_hf_f_${item.id}`);
            if (fieldComponent) {
                fieldComponent.setError(item.errorMessage);
                if (!focused) {
                    fieldComponent.focus();
                    focused = true;
                }
            }
        }
    }

    clearErrors() {
        for (const id of this.fieldIds) {
            const fieldComponent = this.getComponent(`hr_hf_f_${id}`);
            if (fieldComponent) {
                fieldComponent.clearError();
            }
        }
    }

    setLoading(flag) {
        this.setState("loading", flag);
        for (const id of this.fieldIds) {
            const fieldComponent = this.getComponent(`hr_hf_f_${id}`);
            if (fieldComponent) {
                fieldComponent.setLoading(flag);
            }
        }
    }

    onFormSubmit(e) {
        e.preventDefault();
        this.emit("form-submit", {});
    }

    onButtonClick(payload) {
        if (payload.type === "submit") {
            this.emit("form-submit", {});
        }
        this.emit("button-click", payload);
    }
};
