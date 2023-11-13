import {
    mdiPencilOutline,
    mdiTrashCanOutline,
    mdiAccountPlusOutline,
} from "@mdi/js";
import {
    format,
} from "date-fns";
import utils from "#lib/formValidatorUtils";

const formId = "groups";

export default class {
    constructor(t) {
        this.t = t || (id => id);
        this.data = {
            form: [{
                fields: [{
                    id: "group",
                    type: "text",
                    label: this.t("group"),
                    mandatory: true,
                    validation: {
                        type: ["string"],
                        pattern: "^[a-zA-Z0-9]+$",
                        minLength: 2,
                        maxLength: 32,
                    },
                    sortable: true,
                    searchable: true,
                    css: "hr-hf-field-medium",
                    column: true,
                    createIndex: true,
                    helpText: this.t("groupHelpText"),
                    autoFocus: true,
                    width: "auto",
                    minWidth: 250,
                }, {
                    id: "data",
                    type: "keyValue",
                    label: this.t("data"),
                    mandatory: false,
                    validation: {
                        type: ["array", "null"],
                        items: {
                            type: "object",
                            properties: {
                                uid: {
                                    type: "string",
                                    pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
                                },
                                id: {
                                    type: "string",
                                    maxLength: 32,
                                },
                                type: {
                                    type: "string",
                                    maxLength: 32,
                                },
                                value: {
                                    oneOf: [{
                                        type: "string",
                                        maxLength: 1024,
                                    }, {
                                        type: "boolean",
                                    }, {
                                        type: "null",
                                    }]
                                },
                            },
                            required: ["uid", "id", "type"],
                        },
                        minItems: 0,
                        uniqueItems: false,
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
        this.validationRequired = ["group"];
        this.validationData = utils.getValidationData(this.data.form);
        this.columnTypes = ["text", "select", "column", "date"];
        this.defaultSortColumn = "group";
        this.defaultSortDirection = "asc";
        this.actionColumn = true;
        this.checkboxColumn = true;
        this.modeChangeAllowed = false;
        this.tableLoadConfig = {
            url: `/api/${formId}/list`,
        };
        this.tableDeleteConfig = {
            url: `/api/${formId}/delete`,
            titleId: "group",
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
            label: this.t("newItemGroup"),
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
