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
                    hidden: true,
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
                    hidden: true,
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
                    hidden: true,
                }, {
                    id: "message",
                    type: "text",
                    label: this.t("message"),
                    validation: {},
                    sortable: true,
                    searchable: true,
                    column: true,
                    createIndex: false,
                    hidden: true,
                }],
            }],
        };
        this.validationData = utils.getValidationData(this.data.form);
        this.columnTypes = ["text", "select", "column", "date"];
        this.defaultSortColumn = "date";
        this.defaultSortDirection = "desc";
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
        return [{
            id: "_default",
            label: "",
        }];
    }

    getTabsStart() {
        return ["_default"];
    }

    getTableColumns() {
        return Object.fromEntries(Object.entries(this.validationData.fieldsFlat).filter(([, value]) => this.columnTypes.indexOf(value.type) > -1));
    }
}
