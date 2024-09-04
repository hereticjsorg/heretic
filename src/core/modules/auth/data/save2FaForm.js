import utils from "#lib/formValidatorUtils.js";

export default class {
    constructor(t) {
        this.t = t || ((id) => id);
        this.data = {
            form: [
                {
                    fields: [
                        {
                            id: "code",
                            type: "text",
                            validation: {
                                type: ["string"],
                                maxLength: 6,
                                pattern: "[0-9]{6}",
                            },
                        },
                        {
                            id: "secret",
                            type: "text",
                            validation: {
                                type: ["string"],
                                maxLength: 32,
                            },
                        },
                    ],
                },
            ],
        };
        this.validationData = utils.getValidationData(this.data.form);
        this.validationRequired = ["code", "secret"];
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
