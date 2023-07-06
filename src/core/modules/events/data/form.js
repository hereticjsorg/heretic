import {
    mdiTrashCanOutline,
    mdiTextBoxSearchOutline,
} from "@mdi/js";
import {
    format,
} from "date-fns";

import moduleConfig from "../module.js";
import utils from "#lib/formValidatorUtils";

export default class {
    constructor(t) {
        this.t = t || (id => id);
        this.data = {
            form: [{
                fields: [{
                    id: "event",
                    type: "select",
                    label: this.t("event"),
                    validation: {
                        type: "string",
                        enum: []
                    },
                    options: [],
                    defaultValue: "",
                    sortable: true,
                    searchable: true,
                    column: true,
                    createIndex: true,
                }, {
                    id: "date",
                    type: "date",
                    label: this.t("eventDate"),
                    validation: {
                        type: ["integer", "null"]
                    },
                    convert: "integer",
                    sortable: true,
                    searchable: false,
                    column: true,
                    createIndex: true,
                }, {
                    id: "ip",
                    type: "text",
                    label: this.t("eventIP"),
                    validation: {
                        type: ["string", "null"]
                    },
                    sortable: true,
                    searchable: true,
                    column: true,
                    createIndex: true,
                }, {
                    id: "location",
                    type: "text",
                    label: this.t("eventLocation"),
                    validation: {
                        type: ["string", "null"]
                    },
                    sortable: false,
                    searchable: false,
                    column: true,
                    createIndex: false,
                    noFilter: true,
                }, {
                    id: "username",
                    type: "text",
                    label: this.t("eventUsername"),
                    validation: {
                        type: ["string", "null"]
                    },
                    sortable: true,
                    searchable: true,
                    column: true,
                    createIndex: true,
                }],
            }],
        };
        this.validationData = utils.getValidationData(this.data.form);
        this.columnTypes = ["text", "select", "column", "date"];
        this.defaultSortColumn = "date";
        this.defaultSortDirection = "desc";
        this.actionColumn = true;
        this.checkboxColumn = true;
        this.modeChangeAllowed = false;
        this.tableLoadConfig = {
            url: `/api/${moduleConfig.id}/list`,
        };
        this.tableDeleteConfig = {
            url: `/api/${moduleConfig.id}/delete`,
            titleId: "ip",
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

    setProviderDataEvents(data) {
        this.providerDataEvents = data;
        const eventField = this.data.form[0].fields.find(i => i.id === "event");
        eventField.options = Object.keys(data).map(k => ({
            value: k,
            label: data[k].title,
        }));
        eventField.validation.enum = Object.keys(data);
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
            id: "view",
            label: this.t("view"),
            icon: mdiTextBoxSearchOutline,
        }, {
            id: "delete",
            label: this.t("delete"),
            icon: mdiTrashCanOutline,
            danger: true,
        }];
    }

    getTopButtons() {
        return [{
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
        case "event":
            if (!this.providerDataEvents) {
                return;
            }
            return this.providerDataEvents[row[id]] && this.providerDataEvents[row[id]].title ? this.providerDataEvents[row[id]].title : row[id];
        case "date":
            try {
                return row[id] ? format(new Date(row[id] * 1000), `${this.t("global.dateFormatShort")} ${this.t("global.timeFormatShort")}`) : "";
            } catch {
                return row[id];
            }
            // eslint-disable-next-line no-unreachable
            break;
        case "location":
            return row[id] || "—";
        case "username":
            return row[id] || "—";
        default:
            return row[id];
        }
    }

    processTableRow(row) {
        if (this.providerDataEvents && row.event && this.providerDataEvents[row.event] && this.providerDataEvents[row.event].level) {
            switch (this.providerDataEvents[row.event].level) {
            case "error":
                return "hr-ht-row-error";
            case "warning":
                return "hr-ht-row-warning";
            default:
                return "";
            }
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
