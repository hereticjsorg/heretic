import utils from "#lib/formValidatorUtils.js";

export default class {
    constructor(t) {
        this.t = t || ((id) => id);
        this.data = {
            form: [
                {
                    id: "contactInfo",
                    fields: [
                        [
                            {
                                id: "name",
                                type: "text",
                                label: this.t("contactName"),
                                mandatory: true,
                                validation: {
                                    type: ["string"],
                                },
                                css: "hr-hf-field-large",
                                autoFocus: true,
                            },
                            {
                                id: "email",
                                type: "text",
                                label: this.t("contactEmail"),
                                mandatory: true,
                                validation: {
                                    type: ["string"],
                                    pattern:
                                        "(^(?:[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-])+@(?:[a-zA-Z0-9]|[^\\u0000-\\u007F])(?:(?:[a-zA-Z0-9-]|[^\\u0000-\\u007F]){0,61}(?:[a-zA-Z0-9]|[^\\u0000-\\u007F]))?(?:\\.(?:[a-zA-Z0-9]|[^\\u0000-\\u007F])(?:(?:[a-zA-Z0-9-]|[^\\u0000-\\u007F]){0,61}(?:[a-zA-Z0-9]|[^\\u0000-\\u007F]))?)*$)|^()$",
                                    maxLength: 254,
                                },
                                css: "hr-hf-field-xlarge",
                            },
                            {
                                id: "captcha",
                                type: "captcha",
                                label: this.t("contactCaptcha"),
                                mandatory: true,
                                validation: {
                                    type: ["string"],
                                    pattern:
                                        "^[0-9]{4}_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
                                },
                            },
                        ],
                        [
                            {
                                id: "message",
                                type: "textarea",
                                label: this.t("contactMessage"),
                                mandatory: true,
                                validation: {
                                    type: ["string"],
                                },
                                elementStyle: "hr-cn-message",
                            },
                        ],
                    ],
                },
                {
                    fields: [
                        {
                            id: "btn",
                            type: "buttons",
                            items: [
                                {
                                    id: "save",
                                    type: "submit",
                                    label: this.t("contactSubmitButton"),
                                    css: "button is-primary mt-2",
                                },
                            ],
                        },
                    ],
                },
            ],
        };
        this.validationData = utils.getValidationData(this.data.form);
        this.validationRequired = ["name", "email", "captcha", "message"];
        this.historyConfig = {
            enabled: false,
        };
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

    getFieldsArea() {
        return this.validationData.fieldsArea;
    }

    isModeChangeAllowed() {
        return this.modeChangeAllowed;
    }

    getTabs() {
        return [
            {
                id: "_default",
                label: "",
            },
        ];
    }

    getTabsStart() {
        return ["_default"];
    }
}
