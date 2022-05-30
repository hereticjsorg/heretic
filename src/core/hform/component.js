const Ajv = require("ajv");
const cloneDeep = require("lodash.clonedeep");
const serializableTypes = require("./serializableTypes.json");

module.exports = class {
    onCreate(input) {
        this.state = {
            loading: false,
            tabs: input.tabsStart ? input.tabsStart : input.tabs ? input.tabs.map(t => t.id) : ["_default"],
            activeTab: input.tabs ? input.tabs[0].id : "_default",
            addTabDropdownActive: false,
            data: {},
            errors: {},
        };
        const ajv = new Ajv({
            allErrors: true
        });
        if (input.validationSchema) {
            this.validateSchema = ajv.compile(input.validationSchema);
        }
        this.fieldIds = [];
        this.sharedFieldIds = [];
        this.fieldsFlat = {};
        // Collect field IDs
        for (const area of input.data) {
            for (const item of area.fields) {
                if (Array.isArray(item)) {
                    for (const subItem of item) {
                        this.fieldIds.push(subItem.id);
                        if (subItem.shared) {
                            this.sharedFieldIds.push(subItem.id);
                        }
                        this.fieldsFlat[subItem.id] = subItem;
                    }
                } else {
                    this.fieldIds.push(item.id);
                    this.fieldsFlat[item.id] = item;
                    if (item.shared) {
                        this.sharedFieldIds.push(item.id);
                    }
                }
            }
        }
    }

    setDefaultValues() {
        for (const id of this.fieldIds) {
            if (this.fieldsFlat[id].defaultValue) {
                this.setValue(id, this.fieldsFlat[id].defaultValue);
            } else if (this.fieldsFlat[id].type === "select") {
                this.setValue(id, this.fieldsFlat[id].options[0].value);
            }
        }
    }

    clearValues() {
        for (const id of this.fieldIds) {
            this.setValue(id, null);
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
        this.setDefaultValues();
        window.addEventListener("click", e => {
            const dbAddTabElement = document.getElementById(`${this.input.id}_dm_addTab`);
            if (dbAddTabElement && !dbAddTabElement.contains(e.target)) {
                this.setState("addTabDropdownActive", false);
            }
        });
    }

    serializeView() {
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

    deserializeView(serialized) {
        const data = {};
        for (const id of this.fieldIds) {
            if (serializableTypes.indexOf(this.fieldsFlat[id].type) > -1) {
                const fieldComponent = this.getComponent(`hr_hf_f_${id}`);
                if (fieldComponent) {
                    fieldComponent.setValue(serialized[id]);
                }
            }
        }
        return data;
    }

    validate(data) {
        for (const tab of this.state.tabs) {
            if (this.validateSchema) {
                const result = this.validateSchema(data[tab]);
                if (!result) {
                    const resultArr = [];
                    for (const item of this.validateSchema.errors) {
                        resultArr.push({
                            ...item,
                            tab
                        });
                    }
                    return resultArr;
                }
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
                tab: item.tab,
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
        this.clearErrors();
        if (!errorData || !(Symbol.iterator in Object(errorData))) {
            return;
        }
        let focused = false;
        let tab = null;
        for (const item of errorData) {
            if (!tab) {
                this.setTab(item.tab);
                tab = item.tab;
            }
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

    onAddTabDropdownTriggerClick(e) {
        e.preventDefault();
        e.stopPropagation();
        this.setState("addTabDropdownActive", true);
    }

    onAddTabDropdownItemClick(e) {
        e.preventDefault();
        e.stopPropagation();
        const {
            id
        } = e.target.closest("[data-id]").dataset;
        this.setState("addTabDropdownActive", false);
        this.setState("tabs", [...this.state.tabs, id]);
    }

    copySharedFields(data, prevTab) {
        for (const tab of this.state.tabs) {
            if (!data[tab]) {
                data[tab] = {};
                for (const fieldId of this.fieldIds) {
                    if (this.fieldsFlat[fieldId].defaultValue) {
                        data[tab][fieldId] = this.fieldsFlat[fieldId].defaultValue;
                    } else {
                        data[tab][fieldId] = null;
                    }
                }
            }
            for (const sharedId of this.sharedFieldIds) {
                data[tab][sharedId] = data[prevTab][sharedId];
            }
        }
    }

    saveSharedFields() {
        const data = cloneDeep(this.state.data);
        this.copySharedFields(data, this.state.activeTab);
        this.setState("data", data);
        return data;
    }

    saveView() {
        const data = cloneDeep(this.state.data);
        data[this.state.activeTab] = this.serializeView();
        this.copySharedFields(data, this.state.activeTab);
        this.setState("data", data);
        return data;
    }

    serialize() {
        // const data = cloneDeep(this.state.data);
        // data[this.state.activeTab] = this.serializeView();
        // this.copySharedFields(data, this.state.activeTab);
        // data._shared = {};
        // for (const tab of this.state.tabs) {
        //     for (const sharedId of this.sharedFieldIds) {
        //         data._shared[sharedId] = data[tab][sharedId];
        //         delete data[tab][sharedId];
        //     }
        // }
        // console.log(data);
        // return data;
    }

    onTabDeleteClick(e) {
        e.preventDefault();
        e.stopPropagation();
        const {
            id
        } = e.target.closest("[data-id]").dataset;
        const tabs = this.state.tabs.filter(t => t !== id);
        this.setState("tabs", tabs);
        const {
            data
        } = this.state;
        if (id === this.state.activeTab) {
            const prevTab = this.state.activeTab;
            this.copySharedFields(data, prevTab);
            const activeTab = tabs[0];
            this.setState("activeTab", activeTab);
            if (data[activeTab]) {
                this.deserializeView(data[activeTab]);
            } else {
                this.clearValues();
                this.setDefaultValues();
            }
        }
        delete data[id];
        this.setState("data", data);
        this.clearErrors();
    }

    setTab(id) {
        const data = cloneDeep(this.state.data);
        data[this.state.activeTab] = this.serializeView();
        const prevTab = this.state.activeTab;
        this.copySharedFields(data, prevTab);
        this.setState("activeTab", id);
        if (data[id]) {
            this.deserializeView(data[id]);
        } else {
            this.clearValues();
            this.setDefaultValues();
        }
        this.setState("data", data);
    }

    onTabClick(e) {
        e.preventDefault();
        e.stopPropagation();
        const {
            id
        } = e.target.closest("[data-id]").dataset;
        if (this.state.activeTab === id) {
            return;
        }
        this.setTab(id);
        this.clearErrors();
    }
};
