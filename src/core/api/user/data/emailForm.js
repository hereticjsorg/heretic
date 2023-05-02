const utils = require("../../../lib/formValidatorUtils");

export default class {
    constructor(t) {
        this.t = t || (id => id);
        this.data = {
            form: [{
                fields: [
                    [{
                        id: "email",
                        type: "text",
                        label: this.t("email"),
                        mandatory: true,
                        validation: {
                            type: ["string", "null"],
                            pattern: "(^(?:[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-])+@(?:[a-zA-Z0-9]|[^\\u0000-\\u007F])(?:(?:[a-zA-Z0-9-]|[^\\u0000-\\u007F]){0,61}(?:[a-zA-Z0-9]|[^\\u0000-\\u007F]))?(?:\\.(?:[a-zA-Z0-9]|[^\\u0000-\\u007F])(?:(?:[a-zA-Z0-9-]|[^\\u0000-\\u007F]){0,61}(?:[a-zA-Z0-9]|[^\\u0000-\\u007F]))?)*$)|^()$",
                            maxLength: 254
                        },
                        sortable: true,
                        searchable: true,
                        css: "hr-hf-field-large",
                        column: true,
                        createIndex: true,
                        autoFocus: true,
                    }, {
                        id: "passwordCurrent",
                        type: "text",
                        fieldType: "password",
                        label: this.t("passwordCurrent"),
                        mandatory: true,
                        validation: {
                            type: ["string"]
                        },
                        css: "hr-hf-field-large",
                    }],
                    {
                        id: "buttons",
                        type: "buttons",
                        items: [{
                            id: "btnSubmit",
                            type: "submit",
                            label: this.t("submit"),
                            css: "button is-primary mt-3"
                        }],
                    }
                ],
            }],
        };
        this.validationData = utils.getValidationData(this.data.form);
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
}
