import {
    mdiPencilOutline,
    mdiTrashCanOutline,
    mdiAccountPlusOutline,
} from "@mdi/js";

import utils from "#lib/formValidatorUtils";

const formId = "users";

export default class {
    constructor(t) {
        this.t = t || (id => id);
        this.data = {
            form: [{
                fields: [{
                        id: "username",
                        type: "text",
                        label: this.t("username"),
                        mandatory: true,
                        validation: {
                            type: ["string"],
                            pattern: "^[a-zA-Z][a-zA-Z0-9_]+$",
                            minLength: 2,
                            maxLength: 32,
                        },
                        sortable: true,
                        searchable: true,
                        css: "hr-hf-field-medium",
                        column: true,
                        helpText: this.t("usernameHelpText"),
                        createIndex: true,
                        autoFocus: true,
                        width: 150,
                    }, {
                        id: "active",
                        type: "checkbox",
                        label: this.t("userIsActive"),
                        mandatory: false,
                        validation: {
                            type: ["boolean", "null"],
                        },
                        sortable: true,
                        searchable: true,
                        css: "hr-hf-field-medium",
                        column: true,
                        createIndex: true,
                        autoFocus: false,
                        defaultValue: true,
                        width: 60,
                    }, {
                        id: "displayName",
                        type: "text",
                        label: this.t("displayName"),
                        mandatory: false,
                        validation: {
                            type: ["string", "null"],
                            maxLength: 128,
                        },
                        sortable: true,
                        searchable: true,
                        css: "hr-hf-field-medium",
                        column: true,
                        helpText: this.t("displayNameHelpText"),
                        createIndex: true,
                        autoFocus: false,
                        width: 180,
                    }, {
                        id: "email",
                        type: "text",
                        label: this.t("email"),
                        mandatory: false,
                        validation: {
                            type: ["string", "null"],
                            pattern: "(^(?:[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-])+@(?:[a-zA-Z0-9]|[^\\u0000-\\u007F])(?:(?:[a-zA-Z0-9-]|[^\\u0000-\\u007F]){0,61}(?:[a-zA-Z0-9]|[^\\u0000-\\u007F]))?(?:\\.(?:[a-zA-Z0-9]|[^\\u0000-\\u007F])(?:(?:[a-zA-Z0-9-]|[^\\u0000-\\u007F]){0,61}(?:[a-zA-Z0-9]|[^\\u0000-\\u007F]))?)*$)|^()$",
                            maxLength: 254
                        },
                        sortable: true,
                        searchable: true,
                        css: "hr-hf-field-large",
                        column: true,
                        createIndex: true,
                        width: "auto",
                        minWidth: 250,
                    }, {
                        id: "password",
                        type: "password",
                        label: this.t("password"),
                        helpText: this.t("passwordHelpText"),
                        mandatory: true,
                        validation: {
                            type: ["string"],
                        },
                        sortable: false,
                        searchable: false,
                        column: false,
                        createIndex: false,
                        width: 150,
                    }, {
                        id: "groups",
                        type: "tags",
                        label: this.t("groups"),
                        mandatory: false,
                        validation: {
                            type: ["array", "null"],
                            items: {
                                type: "string",
                                minLength: 2,
                                maxLength: 32,
                            },
                            minItems: 0,
                            uniqueItems: true,
                        },
                        sortable: false,
                        searchable: false,
                        column: true,
                        createIndex: false,
                        enumValues: [],
                        enumUnique: true,
                        enumOnly: true,
                        enumButton: true,
                        enumDropdown: false,
                        width: 180,
                    }
                ],
            }],
        };
        this.validationRequired = ["username", "password"];
        this.validationData = utils.getValidationData(this.data.form);
        this.columnTypes = ["text", "select", "column", "date", "checkbox"];
        this.defaultSortColumn = "username";
        this.defaultSortDirection = "asc";
        this.actionColumn = true;
        this.checkboxColumn = true;
        this.modeChangeAllowed = false;
        this.tableLoadConfig = {
            url: `/api/${formId}/list`,
        };
        this.tableDeleteConfig = {
            url: `/api/${formId}/delete`,
            titleId: "username",
        };
        this.tableBulkUpdateConfig = null;
        this.tableExportConfig = {
            url: `/api/${formId}/export`,
            download: `/api/${formId}/download`,
        };
        this.tableRecycleBinConfig = {
            enabled: false,
        };
        this.historyConfig = {
            enabled: false,
        };
    }

    getData() {
        return this.data;
    }

    getValidationSchema() {
        return {
            type: "object",
            properties: this.validationData.validationSchema,
            required: this.validationRequired,
        };
    }

    getFieldsFlat() {
        return this.validationData.fieldsFlat;
    }

    getTableColumns() {
        return Object.fromEntries(Object.entries(this.validationData.fieldsFlat).filter(([, value]) => this.columnTypes.indexOf(value.type) > -1));
        // return Object.fromEntries(Object.entries(this.validationData.fieldsFlat).filter(([, value]) => this.columnIds.indexOf(value.id) > -1));
    }

    getTableDefaultSortColumn() {
        return {
            id: this.defaultSortColumn,
            direction: this.defaultSortDirection,
        };
    }

    isActionColumn() {
        return this.actionColumn;
    }

    isCheckboxColumn() {
        return this.checkboxColumn;
    }

    getActions() {
        return [{
            id: "edit",
            label: this.t("edit"),
            icon: mdiPencilOutline,
        }, {
            id: "delete",
            label: this.t("delete"),
            icon: mdiTrashCanOutline,
            danger: true,
        }];
    }

    getTopButtons() {
        return [{
            id: "newItem",
            label: this.t("newItem"),
            icon: mdiAccountPlusOutline,
        }, {
            id: "delete",
            label: this.t("deleteSelected"),
            icon: mdiTrashCanOutline,
            danger: true,
        }];
    }

    getTableLoadConfig() {
        return this.tableLoadConfig;
    }

    getTableBulkUpdateConfig() {
        return this.tableBulkUpdateConfig;
    }

    getTableExportConfig() {
        return this.tableExportConfig;
    }

    getRecycleBinConfig() {
        return this.tableRecycleBinConfig;
    }

    getTableDeleteConfig() {
        return this.tableDeleteConfig;
    }

    processTableCell(id, row) {
        switch (id) {
        case "active":
            return row[id] ? this.t("isActive") : "";
        default:
            return row[id];
        }
    }

    isModeChangeAllowed() {
        return this.modeChangeAllowed;
    }

    getTabs() {
        return [{
            id: "_default",
            label: "",
        }];
    }

    getTabsStart() {
        return ["_default"];
    }

    getHistoryConfig() {
        return this.historyConfig;
    }
}
