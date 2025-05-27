import utils from "#lib/formValidatorUtils";
import languages from "#etc/languages.json";

export default class {
    constructor(t) {
        this.t = t || (translate => translate);
        this.data = {
            form: [{
                id: "himageFormData",
                fields: [
                    ...Object.keys(languages).map((k, ix) => ({
                        id: k,
                        type: "text",
                        label: languages[k],
                        mandatory: false,
                        validation: {
                            type: ["string", "null"],
                            minLength: 1,
                            maxLength: 256,
                        },
                        autoFocus: ix === 0,
                    })),
                ],
            }],
        };
        this.validationData = utils.getValidationData(this.data.form);
        this.validationRequired = [];
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
