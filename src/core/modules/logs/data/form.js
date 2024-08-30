import { format } from "date-fns";
import { mdiTextBoxSearchOutline } from "@mdi/js";
import utils from "#lib/formValidatorUtils";
import moduleConfig from "../module.js";

export default class {
    constructor(t) {
        this.t = t || ((id) => id);
        this.data = {
            form: [
                {
                    fields: [
                        {
                            id: "date",
                            type: "date",
                            label: this.t("date"),
                            validation: {
                                type: ["integer", "null"],
                            },
                            convert: "integer",
                            sortable: true,
                            searchable: false,
                            column: true,
                            createIndex: false,
                            width: 155,
                        },
                        {
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
                            hidden: false,
                            width: 90,
                        },
                        {
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
                            width: 60,
                        },
                        {
                            id: "pid",
                            type: "text",
                            label: this.t("pid"),
                            validation: {},
                            sortable: true,
                            searchable: true,
                            column: true,
                            createIndex: false,
                            hidden: false,
                            width: 90,
                        },
                        {
                            id: "type",
                            type: "text",
                            label: this.t("type"),
                            validation: {},
                            sortable: true,
                            searchable: true,
                            column: true,
                            createIndex: false,
                            width: 60,
                        },
                        {
                            id: "code",
                            type: "text",
                            label: this.t("code"),
                            validation: {},
                            sortable: true,
                            searchable: true,
                            column: true,
                            createIndex: false,
                            width: 80,
                        },
                        {
                            id: "resTime",
                            type: "text",
                            label: this.t("resTime"),
                            validation: {},
                            sortable: true,
                            searchable: true,
                            column: true,
                            createIndex: false,
                            hidden: false,
                            width: 100,
                        },
                        {
                            id: "method",
                            type: "text",
                            label: this.t("method"),
                            validation: {},
                            sortable: true,
                            searchable: true,
                            column: true,
                            createIndex: false,
                            width: 60,
                        },
                        {
                            id: "url",
                            type: "text",
                            label: this.t("url"),
                            validation: {},
                            sortable: true,
                            searchable: true,
                            column: true,
                            createIndex: false,
                            width: "auto",
                            minWidth: 300,
                        },
                        {
                            id: "ip",
                            type: "text",
                            label: this.t("ip"),
                            validation: {},
                            sortable: true,
                            searchable: true,
                            column: true,
                            createIndex: false,
                            hidden: false,
                            width: 130,
                        },
                        {
                            id: "message",
                            type: "text",
                            label: this.t("message"),
                            validation: {},
                            sortable: true,
                            searchable: true,
                            column: true,
                            createIndex: false,
                            hidden: false,
                            width: 160,
                        },
                    ],
                },
            ],
        };
        this.validationData = utils.getValidationData(this.data.form);
        this.columnTypes = ["text", "select", "column", "date"];
        this.defaultSortColumn = "date";
        this.defaultSortDirection = "desc";
        this.tableLoadConfig = {
            url: `/api/${moduleConfig.id}/list`,
        };
        this.tableDeleteConfig = {
            url: `/api/${moduleConfig.id}/delete`,
            titleId: "ip",
        };
        this.tableBulkUpdateConfig = null;
        this.tableExportConfig = null;
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

    getTabs() {
        return [
            {
                id: "_default",
                label: "",
            },
        ];
    }

    getTabsStart() {
        return ["_default"];
    }

    getTableColumns() {
        return Object.fromEntries(
            Object.entries(this.validationData.fieldsFlat).filter(
                ([, value]) => this.columnTypes.indexOf(value.type) > -1,
            ),
        );
    }

    getTableLoadConfig() {
        return this.tableLoadConfig;
    }

    getTableDefaultSortColumn() {
        return {
            id: this.defaultSortColumn,
            direction: this.defaultSortDirection,
        };
    }

    processTableCell(id, row) {
        switch (id) {
            case "date":
                try {
                    return row[id]
                        ? format(
                              new Date(row[id] * 1000),
                              `${this.t("global.dateFormatShort")} ${this.t("global.timeFormatShort")}`,
                          )
                        : "";
                } catch {
                    return row[id];
                }
                // eslint-disable-next-line no-unreachable
                break;
            default:
                return row[id];
        }
    }

    getActions() {
        return [
            {
                id: "view",
                label: this.t("view"),
                icon: mdiTextBoxSearchOutline,
            },
        ];
    }

    getTopButtons() {
        return [];
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
}
