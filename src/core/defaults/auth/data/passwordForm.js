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
                        label: this.t("passwordNew"),
                        helpText: this.t("passwordNewHelpText"),
                        mandatory: true,
                        validation: {
                            type: ["string"],
                        },
                        sortable: false,
                        searchable: false,
                        column: false,
                        createIndex: false,
                        css: "hr-hf-field-xxlarge",
                        autoFocus: true,
                        passwordPolicy: true,
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
