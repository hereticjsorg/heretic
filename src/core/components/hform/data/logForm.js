const utils = require("#lib/formValidatorUtils");

export default class {
    constructor(t) {
        this.t = t || (id => id);
        this.data = {
            form: [{
                fields: [
                    [{
                        id: "logValue",
                        type: "text",
                        label: this.t("hform_logValue"),
                        validation: {
                            type: ["string", "null"],
                        },
                        autoFocus: true,
                    }, {
                        id: "logDate",
                        type: "date",
                        label: this.t("hform_logDate"),
                        validation: {
                            type: ["integer", "null"]
                        },
                        convert: "integer",
                        calendarWrapClass: "hr-hf-calendar-wrap-right",
                        css: "hr-hf-field-date",
                    }],
                    {
                        id: "logStatus",
                        type: "select",
                        label: this.t("hform_logStatus"),
                        mandatory: false,
                        validation: {
                            type: ["string", "null"],
                            enum: [null, ""],
                        },
                        options: [{
                            value: "",
                            label: "—"
                        }],
                        defaultValue: "",
                    },
                    {
                        id: "logComments",
                        type: "textarea",
                        validation: {
                            type: ["string", "null"],
                        },
                        elementStyle: "hr-hf-textarea-log",
                        label: this.t("hform_logComments"),
                    }
                ],
            }],
        };
        this.validationData = utils.getValidationData(this.data.form);
        this.modeChangeAllowed = false;
        this.historyConfig = {
            enabled: false,
        };
        this.restrictedFields = [];
        this.restrictedAreas = [];
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

    getActions() {
        return [];
    }

    getTopButtons() {
        return [];
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
