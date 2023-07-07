const utils = require("#lib/formValidatorUtils");

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
                        helpText: this.t("emailHelpText"),
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
                        id: "captcha",
                        type: "captcha",
                        label: this.t("captcha"),
                        helpText: this.t("captchaHelpText"),
                        mandatory: true,
                        validation: {
                            type: ["string"],
                            pattern: "^[0-9]{4}_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
                        },
                        sortable: false,
                        searchable: false,
                        column: false,
                        createIndex: false,
                    }],
                ],
            }, {
                fields: [{
                    id: "buttons",
                    type: "buttons",
                    items: [{
                        id: "btnSubmit",
                        type: "submit",
                        label: this.t("submit"),
                        css: "button is-primary mt-3"
                    }],
                }]
            }]
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
