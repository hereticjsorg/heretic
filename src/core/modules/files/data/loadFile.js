import utils from "#lib/formValidatorUtils";

export default class {
    constructor(t) {
        this.t = t || ((id) => id);
        this.data = {
            form: [
                {
                    fields: [
                        {
                            id: "dir",
                            type: "text",
                            validation: {
                                type: ["string"],
                            },
                        },
                        {
                            id: "filename",
                            type: "text",
                            validation: {
                                type: ["string"],
                            },
                        },
                    ],
                },
            ],
        };
        this.validationData = utils.getValidationData(this.data.form);
        this.validationRequired = ["dir", "filename"];
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
