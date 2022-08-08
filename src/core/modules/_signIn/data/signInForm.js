const utils = require("../../../lib/formValidatorUtils");

export default class {
    constructor(t) {
        this.t = t || (id => id);
        this.data = {
            form: [{
                fields: [{
                    id: "username",
                    type: "text",
                    label: this.t("username"),
                    mandatory: true,
                    autoFocus: true,
                    validation: {
                        type: ["string"],
                        pattern: "^[a-zA-Z0-9_-]+$",
                        minLength: 3,
                        maxLength: 32,
                    }
                }, {
                    id: "password",
                    type: "text",
                    fieldType: "password",
                    label: this.t("password"),
                    mandatory: true,
                    validation: {
                        type: ["string"]
                    }
                }, {
                    id: "buttons",
                    type: "buttons",
                    items: [{
                        id: "btnSubmit",
                        type: "submit",
                        label: this.t("signIn"),
                        css: "button is-primary is-medium is-fullwidth mt-3"
                    }]
                }],
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
