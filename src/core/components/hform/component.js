const cloneDeep = require("lodash.clonedeep");
const {
    v4: uuidv4,
} = require("uuid");
const serializableTypes = require("./serializableTypes.json");
const FormValidator = require("../../lib/formValidatorBrowser").default;
const formValidatorUtils = require("../../lib/formValidatorUtils");
const Query = require("../../lib/queryBrowser").default;
const Utils = require("../../lib/componentUtils").default;

module.exports = class {
    initValidation(input = this.input) {
        for (const area of input.data.getData().form) {
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
        if (input.data.getValidationSchema) {
            this.formValidator = new FormValidator(input.data.getValidationSchema(), this.fieldsFlat);
        }
        if (process.browser) {
            this.forceUpdate();
        }
    }

    onCreate(input, out) {
        let mode = "edit";
        if (process.browser) {
            const query = new Query();
            const queryMode = query.get(`mode_${input.id}`);
            mode = queryMode || mode;
        }
        this.state = {
            loading: false,
            progress: false,
            tabs: input.data.getTabsStart ? input.data.getTabsStart() : input.data.getTabs ? input.data.getTabs().map(t => t.id) : ["_default"],
            activeTab: input.data.getTabs ? input.data.getTabs()[0].id : "_default",
            addTabDropdownActive: false,
            modeChangeAllowed: input.data.isModeChangeAllowed && input.data.isModeChangeAllowed(),
            data: {},
            errors: {},
            errorMessage: null,
            mode,
            title: null,
            historyConfig: input.data.getHistoryConfig ? input.data.getHistoryConfig() : {
                enabled: false,
            },
            historyData: [],
            historyPage: 1,
            historyTotal: 0,
            historyTotalPages: 1,
            historyPagination: [],
            historyActionsDropdownOpen: null,
            keyValueData: [],
            keyValueSelectedKey: null,
            keyValueSelectedType: null,
            keyValueValue: null,
            keyValueFieldId: null,
            keyValueUID: null,
            keyValueDeletePar: null,
            tagsData: null,
            tagsFilter: "",
        };
        this.fieldIds = [];
        this.sharedFieldIds = [];
        this.fieldsFlat = {};
        this.passwordRepeat = {};
        // Collect field IDs
        this.initValidation(input);
        this.language = out.global.language;
        if (process.browser && window.__heretic && window.__heretic.t) {
            this.language = this.language || window.__heretic.outGlobal.language;
        }
    }

    onErrorMessageClose() {
        this.setState("errorMessage", null);
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

    focus() {
        for (const k of Object.keys(this.fieldsFlat)) {
            const field = this.fieldsFlat[k];
            if (field.autoFocus) {
                const component = this.getComponent(`hr_hf_f_${field.id}_${this.state.mode}`);
                if (component && component.focus) {
                    component.focus();
                }
            }
        }
    }

    async onMount() {
        this.query = new Query();
        this.utils = new Utils(this);
        this.focus();
        this.setDefaultValues();
        window.addEventListener("click", e => {
            const dbAddTabElement = document.getElementById(`${this.input.id}_dm_addTab`);
            if (dbAddTabElement && !dbAddTabElement.contains(e.target)) {
                this.setState("addTabDropdownActive", false);
            }
            if (this.state.historyActionsDropdownOpen) {
                const historyActionButton = document.querySelector(`[data-id="${this.state.historyActionsDropdownOpen}"]`);
                if (historyActionButton && !historyActionButton.contains(e.target)) {
                    this.setState("historyActionsDropdownOpen", null);
                }
            }
        });
        this.emit("mount-complete");
    }

    setTitle(title) {
        this.setState("title", title);
    }

    serializeView() {
        const data = {};
        // Get data for each field
        for (const id of this.fieldIds) {
            if (serializableTypes.indexOf(this.fieldsFlat[id].type) > -1) {
                const fieldComponent = this.getComponent(`hr_hf_f_${id}_${this.state.mode}`);
                if (fieldComponent) {
                    data[id] = fieldComponent.getValue();
                    if (this.fieldsFlat[id].type === "password") {
                        const {
                            repeat,
                            value,
                        } = data[id];
                        data[id] = value;
                        this.passwordRepeat[this.state.activeTab] = this.passwordRepeat[this.state.activeTab] || {};
                        this.passwordRepeat[this.state.activeTab][id] = repeat;
                    }
                    if (data[id] === "") {
                        data[id] = null;
                    }
                }
            }
        }
        return data;
    }

    async deserializeView(serialized) {
        const data = {};
        for (const id of this.fieldIds) {
            if (serializableTypes.indexOf(this.fieldsFlat[id].type) > -1) {
                await this.utils.waitForComponent(`hr_hf_f_${id}_${this.state.mode}`);
                const fieldComponent = this.getComponent(`hr_hf_f_${id}_${this.state.mode}`);
                if (this.fieldsFlat[id].type === "keyValue") {
                    for (const item of (serialized[id] || [])) {
                        const currentKeyValueItem = this.state.keyValueData.find(i => i.id === item.id);
                        item.title = currentKeyValueItem.title;
                        switch (currentKeyValueItem.type) {
                        case "database":
                        case "list":
                            const valueItem = currentKeyValueItem.items.find(i => i.id === item.value);
                            item.valueLabel = valueItem ? valueItem.label : valueItem;
                            break;
                        default:
                            item.valueLabel = item.value;
                        }
                    }
                }
                if (fieldComponent) {
                    fieldComponent.setValue(typeof serialized[id] === "undefined" ? null : serialized[id]);
                }
            }
        }
        return data;
    }

    validate(data) {
        for (const tab of this.state.tabs) {
            if (this.formValidator) {
                const result = this.formValidator.validate(data[tab], tab);
                if (result) {
                    console.log(result);
                    return result;
                }
                const resultPasswords = [];
                for (const id of Object.keys(data[tab])) {
                    if (this.fieldsFlat[id].type === "password" && data[tab][id] !== this.passwordRepeat[tab][id]) {
                        resultPasswords.push({
                            instancePath: `/${id}`,
                            keyword: "passwordsDoNotMatch",
                            message: "Passwords to not match",
                            tab,
                        });
                    }
                }
                if (resultPasswords.length) {
                    return resultPasswords;
                }
            }
        }
        return null;
    }

    getErrorData(validationResult) {
        if (!validationResult || !(Symbol.iterator in Object(validationResult))) {
            return {};
        }
        return formValidatorUtils.getErrorData(validationResult, window.__heretic.t);
    }

    setValue(id, value) {
        const fieldComponent = this.getComponent(`hr_hf_f_${id}_${this.state.mode}`);
        if (fieldComponent) {
            fieldComponent.setValue(value);
        }
    }

    getValue(id) {
        const fieldComponent = this.getComponent(`hr_hf_f_${id}_${this.state.mode}`);
        if (fieldComponent) {
            if (this.fieldsFlat[id].type === "password") {
                return fieldComponent.getValue().value;
            }
            return fieldComponent.getValue();
        }
        return null;
    }

    setErrors(errorData) {
        this.clearErrors();
        if (!errorData || !(Symbol.iterator in Object(errorData))) {
            return this;
        }
        let focused = false;
        let tab = null;
        for (const item of errorData) {
            if (!tab) {
                this.setTab(item.tab);
                tab = item.tab;
            }
            const fieldComponent = this.getComponent(`hr_hf_f_${item.id}_${this.state.mode}`);
            if (fieldComponent) {
                fieldComponent.setError(item.errorMessage);
                if (!focused) {
                    fieldComponent.focus();
                    focused = true;
                }
            }
        }
        return this;
    }

    clearErrors() {
        for (const id of this.fieldIds) {
            const fieldComponent = this.getComponent(`hr_hf_f_${id}_${this.state.mode}`);
            if (fieldComponent) {
                fieldComponent.clearError();
            }
        }
    }

    setComponentsState(flag) {
        for (const id of this.fieldIds) {
            const fieldComponent = this.getComponent(`hr_hf_f_${id}_${this.state.mode}`);
            if (fieldComponent && fieldComponent.setLoading) {
                fieldComponent.setLoading(flag);
            }
        }
    }

    setLoading(flag) {
        this.setState("loading", flag);
        this.setComponentsState(flag);
        return this;
    }

    setProgress(flag) {
        this.setState("progress", flag);
        this.setComponentsState(flag);
    }

    onFormSubmit(e) {
        e.preventDefault();
        this.emit("form-submit", {});
    }

    onButtonClick(payload) {
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

    saveView() {
        const data = cloneDeep(this.state.data);
        data[this.state.activeTab] = this.serializeView();
        this.copySharedFields(data, this.state.activeTab);
        this.setState("data", data);
        return data;
    }

    serializeData() {
        const data = cloneDeep({
            formTabs: this.saveView(),
            formShared: {},
            upload: {},
            tabs: this.state.tabs,
        });
        for (const tab of this.state.tabs) {
            for (const fieldId of this.fieldIds) {
                if (this.fieldsFlat[fieldId].type === "files" && data.formTabs[tab][fieldId] && data.formTabs[tab][fieldId].length) {
                    for (let i = 0; i < data.formTabs[tab][fieldId].length; i += 1) {
                        if (data.formTabs[tab][fieldId][i].data) {
                            data.upload[data.formTabs[tab][fieldId][i].uid] = data.formTabs[tab][fieldId][i].data;
                        }
                        data.formTabs[tab][fieldId][i] = cloneDeep(data.formTabs[tab][fieldId][i]);
                        delete data.formTabs[tab][fieldId][i].data;
                    }
                }
                if (this.fieldsFlat[fieldId].type === "keyValue" && Array.isArray(data.formTabs[tab][fieldId])) {
                    for (let i = 0; i < data.formTabs[tab][fieldId].length; i += 1) {
                        for (const item of (data.formTabs[tab][fieldId] || [])) {
                            delete item.title;
                            delete item.valueLabel;
                            if (item.type === "boolean") {
                                item.value = (item.value === "true" || item.value === true);
                            }
                            if (item.value === "") {
                                item.value = null;
                            }
                        }
                    }
                }
            }
        }
        for (const sharedFieldId of this.sharedFieldIds) {
            for (const tab of this.state.tabs) {
                data.formShared[sharedFieldId] = data.formTabs[tab][sharedFieldId];
                delete data.formTabs[tab][sharedFieldId];
            }
        }
        return data;
    }

    async deserializeData(data) {
        let tabs = Object.keys(data).filter(i => !i.match(/^_/));
        if (!tabs.length) {
            tabs = ["_default"];
        }
        const activeTab = tabs.length ? tabs[0] : "_default";
        this.setState("tabs", tabs);
        this.setState("activeTab", activeTab);
        if (data._shared) {
            for (const sharedFieldId of this.sharedFieldIds) {
                for (const tab of tabs) {
                    data[tab][sharedFieldId] = data._shared[sharedFieldId];
                }
            }
            delete data._shared;
        }
        await this.deserializeView(data[activeTab]);
        this.focus();
    }

    getFormDataObject(serializedData) {
        const formData = new FormData();
        formData.append("formTabs", JSON.stringify(serializedData.formTabs));
        formData.append("formShared", JSON.stringify(serializedData.formShared));
        formData.append("tabs", JSON.stringify(serializedData.tabs));
        if (serializedData.upload) {
            for (const uk of Object.keys(serializedData.upload)) {
                serializedData.append(uk, serializedData.upload[uk]);
            }
        }
        return formData;
    }

    async onTabDeleteClick(e) {
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
                await this.deserializeView(data[activeTab]);
            } else {
                this.clearValues();
                this.setDefaultValues();
            }
        }
        delete data[id];
        this.setState("data", data);
        this.clearErrors();
    }

    async setTab(id) {
        const data = cloneDeep(this.state.data);
        data[this.state.activeTab] = this.serializeView();
        const prevTab = this.state.activeTab;
        this.copySharedFields(data, prevTab);
        this.setState("activeTab", id);
        if (data[id]) {
            await this.deserializeView(data[id]);
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

    process() {
        this.clearErrors();
        const data = this.saveView();
        const validationResult = this.validate(data);
        if (validationResult) {
            const errorData = this.getErrorData(validationResult);
            this.setErrors(errorData);
            return null;
        }
        const serializedData = this.serializeData();
        return serializedData;
    }

    showNotification(message, css = "") {
        this.getComponent(`notify_field_${this.input.id}`).show(window.__heretic.t(message), css);
    }

    setErrorMessage(message) {
        this.setState("errorMessage", message);
        if (message) {
            this.utils.waitForElement(`${this.input.id}_errorNotification`).then(() => {
                document.getElementById(`${this.input.id}_errorNotification`).scrollIntoView({
                    block: "start",
                    inline: "nearest"
                });
            });
        }
        return this;
    }

    onNotify(data) {
        this.showNotification(data.message, data.css);
    }

    async switchMode(mode) {
        if (mode === this.state.mode) {
            return;
        }
        const data = this.serializeView();
        this.setState("mode", mode);
        await this.deserializeView(data);
        this.focus();
        this.query.set(`mode_${this.input.id}`, mode);
    }

    async onModeChange(e) {
        e.preventDefault();
        const {
            mode
        } = e.target.closest("[data-mode]").dataset;
        this.switchMode(mode);
    }

    generateHistoryPagination() {
        const center = [this.state.historyPage - 2, this.state.historyPage - 1, this.state.historyPage, this.state.historyPage + 1, this.state.historyPage + 2];
        const filteredCenter = center.filter((p) => p > 1 && p < this.state.historyTotalPages);
        // includeThreeLeft
        if (this.state.historyPage === 5) {
            filteredCenter.unshift(2);
        }
        // includeThreeRight
        if (this.state.historyPage === this.state.historyTotalPages - 4) {
            filteredCenter.push(this.state.historyTotalPages - 1);
        }
        // includeLeftDots
        if (this.state.historyPage > 5) {
            filteredCenter.unshift("...");
        }
        // includeRightDots
        if (this.state.historyPage < this.state.historyTotalPages - 4) {
            filteredCenter.push("...");
        }
        // Finalize
        const pagination = [1, ...filteredCenter, this.state.historyTotalPages];
        if (pagination.join(",") === "1,1") {
            pagination.pop();
        }
        // Set pagination
        this.setState("historyPagination", pagination);
    }

    async setHistoryData(historyData = {
        items: [],
        total: 0,
        itemsPerPage: 30,
        page: 1,
    }) {
        this.setState("historyData", historyData.items);
        this.setState("historyTotal", historyData.total);
        this.setState("historyPage", historyData.page || 1);
        this.setState("historyTotalPages", historyData.total < historyData.itemsPerPage ? 1 : Math.ceil(historyData.total / historyData.itemsPerPage));
        this.generateHistoryPagination();
        await this.utils.waitForComponent(`historyModal_hf_${this.input.id}`);
        const historyModal = this.getComponent(`historyModal_hf_${this.input.id}`);
        historyModal.setActive(true).setCloseAllowed(true).setLoading(false);
    }

    async onHistoryClick(e) {
        e.preventDefault();
        this.emit("request-history", {
            page: 1,
        });
    }

    onHistoryModalButtonClick() {}

    async setHistoryModalLoading(flag) {
        await this.utils.waitForComponent(`historyModal_hf_${this.input.id}`);
        this.getComponent(`historyModal_hf_${this.input.id}`).setLoading(flag);
    }

    async setHistoryModalActive(flag) {
        await this.utils.waitForComponent(`historyModal_hf_${this.input.id}`);
        this.getComponent(`historyModal_hf_${this.input.id}`).setActive(flag);
    }

    async onHistoryPageClick(page) {
        this.setHistoryModalLoading(true);
        this.emit("request-history", {
            page,
        });
    }

    async onHistoryActionsClick(e) {
        e.preventDefault();
        const {
            id,
        } = e.target.closest("[data-id]").dataset;
        this.setState("historyActionsDropdownOpen", id);
    }

    async onHistoryActionRestore(e) {
        e.preventDefault();
        const {
            id,
        } = e.target.closest("[data-id]").dataset;
        this.emit("restore-history", id);
    }

    async onHistoryActionDelete(e) {
        e.preventDefault();
        const {
            id,
        } = e.target.closest("[data-id]").dataset;
        this.historyDeleteId = id;
        await this.utils.waitForComponent(`historyDeleteConfirmation_hf_${this.input.id}`);
        this.getComponent(`historyDeleteConfirmation_hf_${this.input.id}`).setActive(true);
    }

    async onHistoryDeleteConfirmationButtonClick(button) {
        await this.utils.waitForComponent(`historyDeleteConfirmation_hf_${this.input.id}`);
        this.getComponent(`historyDeleteConfirmation_hf_${this.input.id}`).setActive(false);
        switch (button) {
        case "delete":
            this.emit("delete-history", this.historyDeleteId);
            break;
        }
    }

    setProviderData(data) {
        this.setState("keyValueData", data);
    }

    async onKeyValueAddRequest(par) {
        await this.utils.waitForComponent(`keyValueModal_hf_${this.input.id}`);
        const keyValueModal = this.getComponent(`keyValueModal_hf_${this.input.id}`);
        keyValueModal.setActive(true);
        this.setState("keyValueSelectedKey", this.state.keyValueData[0].id);
        this.setState("keyValueSelectedType", this.state.keyValueData[0].type);
        this.setState("keyValueFieldId", par.id);
        this.setState("keyValueUID", null);
        await this.utils.waitForElement(`hform_keyValue_value_${this.input.id}`);
        this.setKeyValueDefaults(this.state.keyValueData[0].id);
        document.getElementById(`hform_keyValueModal_${this.input.id}_key`).focus();
    }

    async saveKeyValueFormData() {
        await this.utils.waitForComponent(`keyValueModal_hf_${this.input.id}`);
        const keyValueModal = this.getComponent(`keyValueModal_hf_${this.input.id}`);
        await this.utils.waitForComponent(`hr_hf_f_${this.state.keyValueFieldId}_${this.state.mode}`);
        const fieldComponent = this.getComponent(`hr_hf_f_${this.state.keyValueFieldId}_${this.state.mode}`);
        let valueLabel;
        const currentKeyValueItem = this.state.keyValueData.find(i => i.id === this.state.keyValueSelectedKey);
        switch (currentKeyValueItem.type) {
        case "database":
        case "list":
            const valueItem = currentKeyValueItem.items.find(i => i.id === this.state.keyValueValue);
            valueLabel = valueItem ? valueItem.label : valueItem;
            break;
        default:
            valueLabel = this.state.keyValueValue;
        }
        const currentValue = fieldComponent.getValue() || [];
        const sameKeyValue = currentValue.find(i => i.id === this.state.keyValueSelectedKey);
        if (currentKeyValueItem.unique && ((!this.state.keyValueUID && sameKeyValue) || (this.state.keyValueUID && sameKeyValue && sameKeyValue.uid !== this.state.keyValueUID))) {
            this.showNotification("hform_keyIsNotUnique", "is-danger");
            return;
        }
        keyValueModal.setActive(false);
        if (this.state.keyValueUID) {
            const value = fieldComponent.getValue();
            const item = value.find(i => i.uid === this.state.keyValueUID);
            item.id = this.state.keyValueSelectedKey;
            item.type = this.state.keyValueSelectedType;
            item.title = currentKeyValueItem.title;
            item.value = this.state.keyValueValue;
            item.valueLabel = valueLabel;
            await fieldComponent.setValue(value);
        } else {
            await fieldComponent.setValue([...currentValue, {
                uid: uuidv4(),
                id: this.state.keyValueSelectedKey,
                type: this.state.keyValueSelectedType,
                title: currentKeyValueItem.title,
                value: this.state.keyValueValue,
                valueLabel,
            }]);
        }
    }

    async onKeyValueModalButtonClick(button) {
        switch (button) {
        case "save":
            await this.saveKeyValueFormData();
            break;
        }
    }

    onKeyValueModalFormSubmit(e) {
        e.preventDefault();
        this.saveKeyValueFormData();
    }

    setKeyValueDefaults(key) {
        const {
            type,
            items,
        } = this.state.keyValueData.find(i => i.id === key);
        this.setState("keyValueSelectedKey", key);
        this.setState("keyValueSelectedType", type);
        switch (type) {
        case "list":
        case "database":
            this.setState("keyValueValue", items[0].id);
            break;
        case "boolean":
            this.setState("keyValueValue", true);
            break;
        default:
            this.setState("keyValueValue", "");
            break;
        }
    }

    onKeyValueKeyChange(e) {
        const key = e.target.value;
        this.setKeyValueDefaults(key);
    }

    onKeyValueValueChange(e) {
        const {
            value
        } = e.target;
        this.setState("keyValueValue", value);
    }

    async onKeyValueEditRequest(par) {
        await this.utils.waitForComponent(`hr_hf_f_${par.id}_${this.state.mode}`);
        const fieldComponent = this.getComponent(`hr_hf_f_${par.id}_${this.state.mode}`);
        const keyValueItem = fieldComponent.getValue().find(i => i.uid === par.uid);
        await this.utils.waitForComponent(`keyValueModal_hf_${this.input.id}`);
        const keyValueModal = this.getComponent(`keyValueModal_hf_${this.input.id}`);
        keyValueModal.setActive(true);
        this.setState("keyValueFieldId", par.id);
        this.setState("keyValueUID", par.uid);
        this.setState("keyValueSelectedKey", keyValueItem.id);
        this.setState("keyValueSelectedType", keyValueItem.type);
        await this.utils.waitForElement(`hform_keyValue_value_${this.input.id}`);
        this.setState("keyValueValue", keyValueItem.value);
        document.getElementById(`hform_keyValueModal_${this.input.id}_key`).focus();
    }

    async onKeyValueDeleteRequest(par) {
        await this.utils.waitForComponent(`groupDataDeleteConfirmation_hf_${this.input.id}`);
        this.getComponent(`groupDataDeleteConfirmation_hf_${this.input.id}`).setActive(true);
        this.setState("keyValueDeletePar", par);
    }

    async onGroupDataDeleteConfirmationButtonClick(button) {
        switch (button) {
        case "delete":
            await this.utils.waitForComponent(`hr_hf_f_${this.state.keyValueDeletePar.id}_${this.state.mode}`);
            const fieldComponent = this.getComponent(`hr_hf_f_${this.state.keyValueDeletePar.id}_${this.state.mode}`);
            const currentValue = fieldComponent.getValue() || [];
            fieldComponent.setValue(currentValue.filter(i => i.uid !== this.state.keyValueDeletePar.uid));
            await this.utils.waitForComponent(`groupDataDeleteConfirmation_hf_${this.input.id}`);
            this.getComponent(`groupDataDeleteConfirmation_hf_${this.input.id}`).setActive(false);
            break;
        }
    }

    onTagAddModalButtonClick() {}

    async onTagAddRequest(par) {
        par.dataSave = cloneDeep(par.data);
        this.setState("tagsData", par);
        this.setState("tagsFilter", "");
        await this.utils.waitForComponent(`tagAddModal_hf_${this.input.id}`);
        this.getComponent(`tagAddModal_hf_${this.input.id}`).setActive(true);
        await this.utils.waitForElement(`tagAddModal_filter_${this.input.id}`);
        document.getElementById(`tagAddModal_filter_${this.input.id}`).focus();
    }

    async onTagClick(e) {
        e.preventDefault();
        const {
            id,
        } = e.target.closest("[data-id]").dataset;
        await this.utils.waitForComponent(`tagAddModal_hf_${this.input.id}`);
        this.getComponent(`tagAddModal_hf_${this.input.id}`).setActive(false);
        await this.utils.waitForComponent(`hr_hf_f_${this.state.tagsData.id}_${this.state.mode}`);
        const fieldComponent = this.getComponent(`hr_hf_f_${this.state.tagsData.id}_${this.state.mode}`);
        fieldComponent.addTag(id);
    }

    onTagsFilterKeyup() {
        setTimeout(() => {
            const inputField = document.getElementById(`tagAddModal_filter_${this.input.id}`);
            const value = inputField.value ? cloneDeep(inputField.value).trim() : null;
            const tagsData = cloneDeep(this.state.tagsData);
            tagsData.data = value ? tagsData.dataSave.filter(i => String(i.id).match(new RegExp(value, "i")) || String(i.label).match(new RegExp(value, "i"))) : tagsData.dataSave;
            this.setState("tagsData", tagsData);
            this.setState("tagsFilter", value);
        });
    }
};
