import utils from "#lib/formValidatorUtils";
import languages from "#etc/languages.json";

export default class {
    constructor(t) {
        this.t = t || (id => id);
        this.data = {
            form: [{
                id: "navItem",
                fields: [
                    [{
                        id: "id",
                        type: "text",
                        label: this.t("itemId"),
                        mandatory: true,
                        validation: {
                            type: ["string"],
                            minLength: 1,
                            maxLength: 256,
                        },
                        css: "hr-hf-field-large",
                        helpText: this.t("itemIdHelpText"),
                        autoFocus: true,
                    }], [{
                        id: "url",
                        type: "text",
                        label: this.t("itemUrl"),
                        helpText: this.t("itemUrlHelpText"),
                        mandatory: false,
                        validation: {
                            type: ["string", "null"],
                            minLength: 1,
                            maxLength: 256,
                        },
                        css: "hr-hf-field-xlarge",
                    }, {
                        id: "target",
                        type: "text",
                        label: this.t("itemTarget"),
                        helpText: this.t("itemTargetHelpText"),
                        mandatory: false,
                        validation: {
                            type: ["string", "null"],
                            minLength: 1,
                            maxLength: 256,
                        },
                        css: "hr-hf-field-medium",
                    }],
                    ...Object.keys(languages).map(k => ({
                        id: k,
                        type: "text",
                        label: languages[k],
                        helpText: this.t("itemLabelHelpText"),
                        mandatory: false,
                        validation: {
                            type: ["string", "null"],
                            minLength: 1,
                            maxLength: 256,
                        },
                    })),
                ],
            }],
        };
        this.validationData = utils.getValidationData(this.data.form);
        this.validationRequired = ["id"];
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
        return false;
    }

    getTabs() {
        return [{
            id: "_default",
            label: "",
        }];
    }

    getTabsStart() {
        return ["_default"];
    }
}
