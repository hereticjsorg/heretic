import utils from "#lib/formValidatorUtils.js";

export default class {
    constructor(t) {
        this.t = t || ((id) => id);
        this.data = {
            form: [
                {
                    fields: [
                        {
                            id: "language",
                            type: "text",
                            validation: {
                                type: ["string"],
                                pattern: "^[a-z]{2}-[a-z]{2}$",
                                maxLength: 5,
                            },
                        },
                        {
                            id: "type",
                            type: "text",
                            validation: {
                                type: ["string"],
                                enum: ["site", "cookies"],
                            },
                        },
                    ],
                },
            ],
        };
        this.validationData = utils.getValidationData(this.data.form);
        this.validationRequired = ["language", "type"];
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
