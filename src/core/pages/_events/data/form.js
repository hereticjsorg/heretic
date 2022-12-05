import {
    mdiTrashCanOutline,
    mdiFileFindOutline,
} from "@mdi/js";
// import {
//     format,
// } from "date-fns";

import moduleConfig from "../admin.js";
import utils from "../../../lib/formValidatorUtils";

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
                        enum: ["loginSuccess", "loginFailed"]
                    },
                    options: [{
                        value: "loginSuccess",
                        label: "eventLoginSuccess"
                    }, {
                        value: "loginFailed",
                        label: "eventLoginFailed"
                    }],
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
                    type: "string",
                    label: this.t("eventIP"),
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
        this.defaultSortColumn = "event";
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
            id: "view",
            label: this.t("view"),
            icon: mdiFileFindOutline,
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
