const {
    mdiPencilOutline,
    mdiTrashCanOutline,
    mdiAccountPlusOutline,
} = require("@mdi/js");
const {
    format,
} = require("date-fns");
const moduleConfig = require("../module");
const utils = require("#lib/formValidatorUtils");

export default class {
    constructor(t) {
        this.t = t || (id => id);
        this.data = {
            form: [{
                id: "generalInfo",
                label: this.t("areaGeneralInfo"),
                css: "hr-hf-area",
                fields: [{
                        id: "id",
                        type: "column",
                        label: this.t("id"),
                        sortable: true,
                        column: true,
                        createIndex: true,
                    },
                    [{
                        id: "firstName",
                        type: "text",
                        label: this.t("firstName"),
                        mandatory: true,
                        validation: {
                            type: ["string"],
                        },
                        sortable: true,
                        searchable: true,
                        css: "hr-hf-field-large",
                        column: true,
                        createIndex: true,
                        autoFocus: true,
                    }, {
                        id: "lastName",
                        type: "text",
                        label: this.t("lastName"),
                        mandatory: true,
                        validation: {
                            type: ["string"],
                        },
                        sortable: true,
                        searchable: true,
                        css: "hr-hf-field-large",
                        column: true,
                        createIndex: true,
                    }, {
                        id: "email",
                        type: "text",
                        label: this.t("email"),
                        mandatory: false,
                        validation: {
                            type: ["null", "string"],
                        },
                        sortable: true,
                        searchable: true,
                        css: "hr-hf-field-xlarge",
                        column: true,
                        createIndex: true,
                    }],
                ],
            }, {
                id: "personalInfo",
                label: this.t("areaPersonalInfo"),
                css: "hr-hf-area",
                fields: [
                    [{
                        id: "birthDate",
                        type: "date",
                        label: this.t("birthDate"),
                        validation: {
                            type: ["integer", "null"]
                        },
                        convert: "integer",
                        sortable: true,
                        searchable: true,
                        css: "hr-hf-field-date",
                        column: true,
                        createIndex: true,
                        hidden: true,
                    }, {
                        id: "sex",
                        type: "select",
                        label: this.t("sex"),
                        mandatory: false,
                        convert: "integer",
                        validation: {
                            type: ["integer", "null"],
                            enum: [1, 2],
                        },
                        options: [{
                            value: "1",
                            label: this.t("sexMale"),
                        }, {
                            value: "2",
                            label: this.t("sexFemale"),
                        }],
                        defaultValue: "1",
                        sortable: true,
                        searchable: true,
                        css: "hr-hf-field-small",
                        column: true,
                        createIndex: true,
                        hidden: true,
                    }, {
                        id: "phone",
                        type: "text",
                        label: this.t("phone"),
                        mandatory: false,
                        validation: {
                            type: ["string", "null"],
                        },
                        sortable: true,
                        searchable: true,
                        css: "hr-hf-field-medium",
                        column: true,
                        createIndex: true,
                        maskedOptions: {
                            mask: "+00 000 000-00-00",
                        },
                        hidden: true,
                    }, {
                        id: "address",
                        type: "text",
                        label: this.t("address"),
                        mandatory: false,
                        validation: {
                            type: ["string", "null"],
                        },
                        sortable: true,
                        searchable: true,
                        css: "hr-hf-field-xlarge",
                        column: true,
                        createIndex: true,
                        hidden: true,
                    }],
                    [{
                        id: "attachments",
                        css: "hr-hf-field-xxlarge",
                        type: "files",
                        label: this.t("attachments"),
                        buttonLabel: this.t("select"),
                        multiple: true,
                        validation: {
                            minCount: 0,
                            maxCount: 10,
                            maxSize: 5096000,
                        },
                        download: `/api/${moduleConfig.id}/download`,
                    }],
                    [{
                        id: "comments",
                        type: "wysiwyg",
                        label: this.t("notes"),
                    }]
                ],
            }, {
                fields: [{
                    id: "btn",
                    type: "buttons",
                    items: [{
                        id: "save",
                        type: "submit",
                        label: this.t("save"),
                        css: "button is-primary",
                    }, {
                        id: "saveClose",
                        type: "submit",
                        label: this.t("saveClose"),
                        css: "button is-primary",
                    }, {
                        id: "close",
                        type: "button",
                        label: this.t("close"),
                        css: "button is-light",
                        showInViewMode: true,
                    }]
                }]
            }],
        };
        this.validationData = utils.getValidationData(this.data.form);
        this.columnTypes = ["text", "select", "column", "date", "div"];
        this.defaultSortColumn = "id";
        this.defaultSortDirection = "asc";
        this.actionColumn = true;
        this.checkboxColumn = true;
        this.modeChangeAllowed = true;
        this.tableLoadConfig = {
            url: `/api/${moduleConfig.id}/list`,
        };
        this.tableDeleteConfig = {
            url: `/api/${moduleConfig.id}/delete`,
            titleId: "id",
        };
        this.tableBulkUpdateConfig = {
            url: `/api/${moduleConfig.id}/bulkSave`,
        };
        this.tableExportConfig = {
            url: `/api/${moduleConfig.id}/export`,
            download: `/api/${moduleConfig.id}/download`,
        };
        this.tableRecycleBinConfig = {
            enabled: true,
            title: "position",
            id: "id",
            url: {
                list: `/api/${moduleConfig.id}/recycleBin/list`,
                restore: `/api/${moduleConfig.id}/recycleBin/restore`,
                delete: `/api/${moduleConfig.id}/recycleBin/delete`,
            }
        };
        this.historyConfig = {
            enabled: true,
            list: `/api/${moduleConfig.id}/history/list`,
        };
        this.restrictedFields = [];
        this.restrictedAreas = ["miscInfo"];
        this.magicStringAccessDenied = "WP0eX1QaOvhNWEgYa8Nx1X2f";
    }

    getData() {
        return this.data;
    }

    getValidationSchema() {
        return {
            type: "object",
            properties: this.validationData.validationSchema,
        };
    }

    getFieldsFlat() {
        return this.validationData.fieldsFlat;
    }

    getFieldsArea() {
        return this.validationData.fieldsArea;
    }

    getTableColumns() {
        return Object.fromEntries(Object.entries(this.validationData.fieldsFlat).filter(([, value]) => this.columnTypes.indexOf(value.type) > -1));
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
        case "sex":
            return String(row[id]) === "1" ? this.t("sexMale") : this.t("sexFemale");
        case "maritalStatus":
            return String(row[id]) === "1" ? this.t("maritalStatusSingle") : this.t("maritalStatusMarried");
        case "familyRelationship":
            return String(row[id]) === "2" ? this.t("relationshipHusband") : String(row[id]) === "3" ? this.t("relationshipChild") : this.t("relationshipEmployee");
        case "phone":
            if (row[id]) {
                const match = row[id].match(/^(\d{2})(\d{3})(\d{3})(\d{2})(\d{2})$/);
                if (match) {
                    return `+${match[1]} ${match[2]} ${match[3]}-${match[4]}-${match[5]}`;
                }
            }
            return row[id] ? `+${row[id]}` : "—";
        case "birthDate":
            try {
                return row[id] ? format(new Date(row[id] * 1000), this.t("global.dateFormatShort")) : "";
            } catch {
                return row[id];
            }
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

    getRestrictedFields() {
        return this.restrictedFields;
    }

    getRestrictedAreas() {
        return this.restrictedAreas;
    }

    getMagicStringAccessDenied() {
        return this.magicStringAccessDenied;
    }
}
