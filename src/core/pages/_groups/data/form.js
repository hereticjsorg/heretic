const {
    mdiPencilOutline,
    mdiTrashCanOutline,
    mdiAccountPlusOutline,
} = require("@mdi/js");
const {
    format,
} = require("date-fns");
const moduleConfig = require("../admin.js");
const utils = require("../../../lib/formValidatorUtils");

export default class {
    constructor(t) {
        this.t = t || (id => id);
        this.data = {
            form: [{
                label: this.t("areaData"),
                css: "hr-hf-area",
                fields: [{
                    id: "group",
                    type: "text",
                    label: this.t("group"),
                    mandatory: true,
                    validation: {
                        type: ["string"],
                    },
                    sortable: true,
                    searchable: true,
                    css: "hr-hf-field-medium",
                    column: true,
                    createIndex: true,
                    autoFocus: true,
                }, {
                    id: "data",
                    type: "keyValue",
                    label: this.t("data"),
                    mandatory: false,
                    validation: {
                    },
                    sortable: false,
                    searchable: false,
                    css: "hr-hf-field-medium",
                    column: false,
                    createIndex: false,
                    autoFocus: false,
                }],
            }],
        };
        this.validationData = utils.getValidationData(this.data.form);
        this.columnTypes = ["text", "select", "column", "date"];
        this.defaultSortColumn = "group";
        this.defaultSortDirection = "asc";
        this.actionColumn = true;
        this.checkboxColumn = true;
        this.modeChangeAllowed = false;
        this.tableLoadConfig = {
            url: `/api/${moduleConfig.id}/list`,
        };
        this.tableDeleteConfig = {
            url: `/api/${moduleConfig.id}/delete`,
            titleId: "group",
        };
        this.tableBulkUpdateConfig = null;
        this.tableExportConfig = {
            url: `/api/${moduleConfig.id}/export`,
            download: `/api/${moduleConfig.id}/download`,
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
        case "position":
            return row[id] || "—";
        case "countryOfBirth":
        case "passportCountry":
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
        case "emea":
            return row[id] ? row[id].toUpperCase() : "—";
        case "birthDate":
        case "passportIssue":
        case "passportExpiry":
        case "hireDate":
            try {
                return row[id] ? format(new Date(row[id] * 1000), this.t("global.dateFormatShort")) : "";
            } catch {
                return row[id];
            }
            // eslint-disable-next-line no-unreachable
            break;
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
