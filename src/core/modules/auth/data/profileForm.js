import utils from "#lib/formValidatorUtils.js";

export default class {
    constructor(t) {
        this.t = t || ((id) => id);
        this.data = {
            form: [
                {
                    fields: [
                        [
                            {
                                id: "displayName",
                                type: "text",
                                label: this.t("displayName"),
                                mandatory: false,
                                validation: {
                                    type: ["string", "null"],
                                    maxLength: 128,
                                },
                                sortable: true,
                                searchable: true,
                                css: "hr-hf-field-xlarge",
                                column: true,
                                helpText: this.t("displayNameHelpText"),
                                createIndex: true,
                                autoFocus: true,
                            },
                            {
                                id: "passwordCurrent",
                                type: "text",
                                fieldType: "password",
                                label: this.t("passwordCurrent"),
                                mandatory: true,
                                validation: {
                                    type: ["string"],
                                },
                                css: "hr-hf-field-large",
                            },
                        ],
                        {
                            id: "buttons",
                            type: "buttons",
                            items: [
                                {
                                    id: "btnSubmit",
                                    type: "submit",
                                    label: this.t("submit"),
                                    css: "button is-primary mt-3",
                                },
                            ],
                        },
                        {
                            id: "profilePicture",
                            type: "text",
                            validation: {
                                type: ["string", "null"],
                                maxLength: 524288,
                            },
                            noRender: true,
                        },
                    ],
                },
            ],
        };
        this.validationData = utils.getValidationData(this.data.form);
        this.validationRequired = ["passwordCurrent"];
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
