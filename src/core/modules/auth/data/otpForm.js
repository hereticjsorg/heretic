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
                                id: "code",
                                type: "text",
                                label: this.t("setup2faCode"),
                                mandatory: true,
                                validation: {
                                    type: ["string"],
                                    maxLength: 6,
                                    pattern: "[0-9]{6}",
                                },
                                sortable: true,
                                searchable: true,
                                css: "hr-hf-field-small",
                                column: false,
                                createIndex: true,
                                autoFocus: true,
                                maskedOptions: {
                                    mask: "000000",
                                },
                            },
                            {
                                id: "username",
                                type: "text",
                                validation: {
                                    type: ["string", "null"],
                                    pattern: "^[a-zA-Z0-9_-]+$",
                                    minLength: 3,
                                    maxLength: 40,
                                },
                                noRender: true,
                            },
                            {
                                id: "password",
                                type: "text",
                                fieldType: "password",
                                validation: {
                                    type: ["string", "null"],
                                },
                                noRender: true,
                            },
                            {
                                id: "token",
                                type: "text",
                                fieldType: "text",
                                validation: {
                                    type: ["string", "null"],
                                },
                                noRender: true,
                            },
                        ],
                    ],
                },
            ],
        };
        this.validationData = utils.getValidationData(this.data.form);
        this.validationRequired = ["code"];
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
