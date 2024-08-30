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
                                maxLength: 256,
                            },
                        },
                    ],
                },
            ],
        };
        this.validationData = utils.getValidationData(this.data.form);
        this.validationRequired = ["dir"];
    }

    setProviderDataEvents() {}

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

    getTabs() {
        return [
            {
                id: "_default",
                label: "",
            },
        ];
    }
}
