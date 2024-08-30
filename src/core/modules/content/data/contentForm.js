import {
    mdiPencilOutline,
    mdiTrashCanOutline,
    mdiAccountPlusOutline,
} from "@mdi/js";

import utils from "#lib/formValidatorUtils";
import languages from "#etc/languages.json";

const formId = "content";

export default class {
    constructor(t) {
        this.t = t || ((id) => id);
        this.data = {
            form: [
                {
                    fields: [
                        [
                            {
                                id: "title",
                                type: "text",
                                label: this.t("pageTitle"),
                                mandatory: true,
                                validation: {
                                    type: ["string"],
                                    minLength: 1,
                                    maxLength: 128,
                                },
                                sortable: true,
                                searchable: true,
                                css: "hr-hf-field-xxlarge",
                                column: true,
                                helpText: this.t("pageTitleHelpText"),
                                createIndex: true,
                                autoFocus: true,
                                width: 250,
                            },
                            {
                                id: "pagePath",
                                type: "tags",
                                label: this.t("pagePath"),
                                helpText: this.t("pagePathHelpText"),
                                mandatory: false,
                                shared: true,
                                css: "hr-hf-field-xlarge",
                                validation: {
                                    type: ["array", "null"],
                                    items: {
                                        type: "string",
                                        minLength: 2,
                                        maxLength: 32,
                                    },
                                    minItems: 0,
                                    uniqueItems: false,
                                },
                                sortable: false,
                                searchable: false,
                                column: true,
                                createIndex: false,
                                enumValues: [],
                                enumUnique: false,
                                enumOnly: false,
                                enumButton: false,
                                enumDropdown: false,
                            },
                            {
                                id: "pagePathText",
                                type: "column",
                                label: this.t("pagePath"),
                                sortable: true,
                                searchable: true,
                                column: true,
                                createIndex: true,
                                width: "auto",
                                minWidth: 200,
                            },
                        ],
                    ],
                },
            ],
        };
        this.validationRequired = ["title"];
        this.validationData = utils.getValidationData(this.data.form);
        this.columnTypes = ["text", "select", "column", "date", "checkbox"];
        this.defaultSortColumn = "title";
        this.defaultSortDirection = "asc";
        this.actionColumn = true;
        this.checkboxColumn = true;
        this.modeChangeAllowed = false;
        this.tableLoadConfig = {
            url: `/api/${formId}/list`,
        };
        this.tableDeleteConfig = {
            url: `/api/${formId}/delete`,
            titleId: "title",
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
            required: this.validationRequired,
        };
    }

    getFieldsFlat() {
        return this.validationData.fieldsFlat;
    }

    getTableColumns() {
        return Object.fromEntries(
            Object.entries(this.validationData.fieldsFlat).filter(
                ([, value]) => this.columnTypes.indexOf(value.type) > -1,
            ),
        );
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
        return [
            {
                id: "edit",
                label: this.t("edit"),
                icon: mdiPencilOutline,
            },
            {
                id: "delete",
                label: this.t("delete"),
                icon: mdiTrashCanOutline,
                danger: true,
            },
        ];
    }

    getTopButtons() {
        return [
            {
                id: "newItem",
                label: this.t("newItem"),
                icon: mdiAccountPlusOutline,
            },
            {
                id: "delete",
                label: this.t("deleteSelected"),
                icon: mdiTrashCanOutline,
                danger: true,
            },
        ];
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
        return Object.keys(languages).map((k) => ({
            id: k,
            label: languages[k],
        }));
    }

    getTabsStart() {
        return [Object.keys(languages)[0]];
    }

    getHistoryConfig() {
        return this.historyConfig;
    }
}
