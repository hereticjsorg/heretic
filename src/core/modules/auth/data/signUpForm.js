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
                                id: "username",
                                type: "text",
                                label: this.t("username"),
                                helpText: this.t("usernameHelpText"),
                                mandatory: true,
                                css: "hr-hf-field-medium",
                                autoFocus: true,
                                validation: {
                                    type: ["string"],
                                    pattern: "^[a-zA-Z0-9_-]+$",
                                    minLength: 3,
                                    maxLength: 40,
                                },
                            },
                            {
                                id: "email",
                                type: "text",
                                label: this.t("email"),
                                helpText: this.t("emailHelpText"),
                                mandatory: true,
                                validation: {
                                    type: ["string"],
                                    pattern:
                                        "(^(?:[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-])+@(?:[a-zA-Z0-9]|[^\\u0000-\\u007F])(?:(?:[a-zA-Z0-9-]|[^\\u0000-\\u007F]){0,61}(?:[a-zA-Z0-9]|[^\\u0000-\\u007F]))?(?:\\.(?:[a-zA-Z0-9]|[^\\u0000-\\u007F])(?:(?:[a-zA-Z0-9-]|[^\\u0000-\\u007F]){0,61}(?:[a-zA-Z0-9]|[^\\u0000-\\u007F]))?)*$)|^()$",
                                    maxLength: 254,
                                },
                                sortable: true,
                                searchable: true,
                                css: "hr-hf-field-large",
                                column: true,
                                createIndex: true,
                            },
                            {
                                id: "password",
                                type: "password",
                                label: this.t("password"),
                                helpText: this.t("passwordHelpText"),
                                mandatory: true,
                                validation: {
                                    type: ["string"],
                                },
                                sortable: false,
                                searchable: false,
                                column: false,
                                createIndex: false,
                                passwordPolicy: true,
                                css: "hr-hf-field-xxlarge",
                            },
                        ],
                    ],
                },
                {
                    id: "captchaArea",
                    fields: [
                        {
                            id: "captcha",
                            type: "captcha",
                            label: this.t("captcha"),
                            helpText: this.t("captchaHelpText"),
                            mandatory: true,
                            validation: {
                                type: ["string"],
                                pattern:
                                    "^[0-9]{4}_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
                            },
                            sortable: false,
                            searchable: false,
                            column: false,
                            createIndex: false,
                        },
                    ],
                },
                {
                    fields: [
                        {
                            id: "buttons",
                            type: "buttons",
                            items: [
                                {
                                    id: "btnSubmit",
                                    type: "submit",
                                    label: this.t("submit"),
                                    css: "button is-primary is-fullwidth mt-3",
                                },
                            ],
                            css: "hr-hf-field-small",
                        },
                    ],
                },
            ],
        };
        this.validationData = utils.getValidationData(this.data.form);
        this.validationRequired = ["username", "email", "password", "captcha"];
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
