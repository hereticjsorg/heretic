import utils from "#lib/formValidatorUtils";

export default class {
    constructor(t) {
        this.t = t || ((id) => id);
        this.data = {
            form: [
                {
                    fields: [
                        [
                            {
                                id: "itemsPerPage",
                                type: "text",
                                label: this.t("htable_itemsPerPage"),
                                mandatory: true,
                                autoFocus: true,
                                validation: {
                                    type: ["integer"],
                                    minimum: 1,
                                    maximum: 9999,
                                },
                                convert: "integer",
                                css: "hr-hf-field-large",
                            },
                        ],
                    ],
                },
            ],
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
