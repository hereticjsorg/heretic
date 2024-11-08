import utils from "#lib/formValidatorUtils";

export default class {
    constructor(t) {
        this.t = t || (id => id);
        this.data = {
            form: [{
                id: "metaData",
                fields: [
                    [{
                        id: "homeId",
                        type: "text",
                        label: this.t("homeId"),
                        mandatory: true,
                        validation: {
                            type: ["string"],
                            minLength: 1,
                            maxLength: 256,
                        },
                        css: "hr-hf-field-medium",
                        helpText: this.t("homeIdHelpText"),
                        autoFocus: true,
                    }],
                ],
            }],
        };
        this.validationData = utils.getValidationData(this.data.form);
        this.validationRequired = ["homeId"];
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
