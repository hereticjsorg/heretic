import utils from "#lib/formValidatorUtils";

export default class {
    constructor(t) {
        this.t = t || (id => id);
        this.data = {
            form: [{
                fields: [{
                        id: "action",
                        type: "text",
                        validation: {
                            type: ["string"],
                            enum: ["copy", "move", "delete", "rename", "newDir", "unzip"]
                        },
                    },
                    {
                        id: "srcDir",
                        type: "text",
                        validation: {
                            type: ["string"],
                        },
                    },
                    {
                        id: "destDir",
                        type: "text",
                        validation: {
                            type: ["string"],
                        },
                    },
                    {
                        id: "srcFile",
                        type: "text",
                        validation: {
                            type: ["string", "null"],
                        },
                    },
                    {
                        id: "destFile",
                        type: "text",
                        validation: {
                            type: ["string", "null"],
                        },
                    },
                    {
                        id: "files",
                        type: "text",
                        validation: {
                            type: "array",
                            items: {
                                type: "string",
                                minLength: 1,
                            },
                            minItems: 0,
                            uniqueItems: true,
                        },
                    },
                ],
            }],
        };
        this.validationData = utils.getValidationData(this.data.form);
        this.validationRequired = ["action", "srcDir", "destDir", "files"];
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
