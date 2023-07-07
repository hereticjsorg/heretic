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
                    id: "date",
                    type: "date",
                    label: this.t("date"),
                    validation: {
                        type: ["integer", "null"]
                    },
                    convert: "integer",
                    sortable: true,
                    searchable: false,
                    column: true,
                    createIndex: false,
                }, {
                    id: "id",
                    type: "text",
                    label: this.t("id"),
                    validation: {},
                    options: [],
                    defaultValue: "",
                    sortable: true,
                    searchable: true,
                    column: true,
                    createIndex: false,
                }, {
                    id: "level",
                    type: "text",
                    label: this.t("level"),
                    validation: {},
                    options: [],
                    defaultValue: "",
                    sortable: true,
                    searchable: true,
                    column: true,
                    createIndex: false,
                }, {
                    id: "pid",
                    type: "text",
                    label: this.t("pid"),
                    validation: {},
                    sortable: true,
                    searchable: true,
                    column: true,
                    createIndex: false,
                    hidden: true,
                }, {
                    id: "type",
                    type: "text",
                    label: this.t("type"),
                    validation: {},
                    sortable: true,
                    searchable: true,
                    column: true,
                    createIndex: false,
                }, {
                    id: "code",
                    type: "text",
                    label: this.t("code"),
                    validation: {},
                    sortable: true,
                    searchable: true,
                    column: true,
                    createIndex: false,
                }, {
                    id: "resTime",
                    type: "text",
                    label: this.t("resTime"),
                    validation: {},
                    sortable: true,
                    searchable: true,
                    column: true,
                    createIndex: false,
                }, {
                    id: "method",
                    type: "text",
                    label: this.t("method"),
                    validation: {},
                    sortable: true,
                    searchable: true,
                    column: true,
                    createIndex: false,
                }, {
                    id: "url",
                    type: "text",
                    label: this.t("url"),
                    validation: {},
                    sortable: true,
                    searchable: true,
                    column: true,
                    createIndex: false,
                }, {
                    id: "ip",
                    type: "text",
                    label: this.t("ip"),
                    validation: {},
                    sortable: true,
                    searchable: true,
                    column: true,
                    createIndex: false,
                }, {
                    id: "message",
                    type: "text",
                    label: this.t("message"),
                    validation: {},
                    sortable: true,
                    searchable: true,
                    column: true,
                    createIndex: false,
                },],
            }],
        };
        this.validationData = utils.getValidationData(this.data.form);
        this.columnTypes = ["text", "select", "column", "date"];
        this.defaultSortColumn = "date";
        this.defaultSortDirection = "desc";
        this.actionColumn = false;
        this.checkboxColumn = false;
        this.modeChangeAllowed = false;
        this.tableLoadConfig = {
            url: `/api/${moduleConfig.id}/list`,
        };
        this.tableDeleteConfig = false;
        this.tableBulkUpdateConfig = null;
        this.tableExportConfig = false;
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
        return [];
    }

    getTopButtons() {
        return [];
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
        case "date":
            try {
                return row[id] ? format(new Date(row[id] * 1000), `${this.t("global.dateFormatShort")} ${this.t("global.timeFormatShort")}`) : "";
            } catch {
                return row[id];
            }
            // eslint-disable-next-line no-unreachable
            break;
        case "type":
            return this.t(row[id]) || "—";
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
