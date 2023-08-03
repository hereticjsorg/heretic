import utils from "#lib/formValidatorUtils";

export default class {
    constructor(t) {
        this.t = t || (id => id);
        this.data = {
            form: [{
                fields: [
                    [{
                        id: "recoveryCode",
                        type: "text",
                        label: this.t("recovery2faCode"),
                        mandatory: true,
                        validation: {
                            type: ["string"],
                            pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$",
                        },
                        css: "hr-hf-field-xlarge",
                        autoFocus: true,
                    }],
                ],
            }],
        };
        this.validationData = utils.getValidationData(this.data.form);
        this.validationRequired = ["recoveryCode"];
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
}
