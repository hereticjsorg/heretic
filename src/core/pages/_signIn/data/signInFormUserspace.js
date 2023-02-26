const utils = require("../../../lib/formValidatorUtils");

export default class {
    constructor(t) {
        this.t = t || (id => id);
        this.data = {
            form: [{
                fields: [
                    [{
                        id: "username",
                        type: "text",
                        label: this.t("username"),
                        mandatory: true,
                        autoFocus: true,
                        validation: {
                            type: ["string"],
                            pattern: "^[a-zA-Z0-9_-]+$",
                            minLength: 3,
                            maxLength: 40,
                        },
                        css: "hr-hf-field-large"
                    }, {
                        id: "password",
                        type: "text",
                        fieldType: "password",
                        label: this.t("password"),
                        mandatory: true,
                        validation: {
                            type: ["string"]
                        },
                        css: "hr-hf-field-large"
                    }], {
                        id: "buttons",
                        type: "buttons",
                        items: [{
                            id: "btnSubmit",
                            type: "submit",
                            label: this.t("submit"),
                            css: "button is-primary mt-3"
                        }]
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
