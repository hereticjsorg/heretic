const utils = require("#lib/formValidatorUtils");

export default class {
    constructor(t) {
        this.t = t || (id => id);
        this.data = {
            form: [{
                fields: [
                    [{
                        id: "password",
                        type: "password",
                        label: this.t("password"),
                        helpText: this.t("passwordHelpText"),
                        mandatory: true,
                        validation: {
                            type: ["string"],
                        },
                        sortable: false,
                        searchable: false,
                        column: false,
                        createIndex: false,
                        passwordPolicy: true,
                        autoFocus: true,
                        css: "hr-hf-field-xxlarge",
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
