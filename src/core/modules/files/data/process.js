import utils from "#lib/formValidatorUtils.js";

export default class {
    constructor(t) {
        this.t = t || ((id) => id);
        this.data = {
            form: [
                {
                    fields: [
                        {
                            id: "action",
                            type: "text",
                            validation: {
                                type: ["string"],
                                enum: [
                                    "copy",
                                    "move",
                                    "delete",
                                    "rename",
                                    "newDir",
                                    "unzip",
                                    "archive",
                                    "untar",
                                    "untgz",
                                ],
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
                        {
                            id: "compressionFormat",
                            type: "text",
                            validation: {
                                type: ["string", "null"],
                                enum: ["zip", "tar", "tgz"],
                            },
                        },
                        {
                            id: "compressionLevel",
                            type: "text",
                            validation: {
                                type: ["integer", "null"],
                                minValue: 0,
                                maxValue: 9,
                            },
                        },
                    ],
                },
            ],
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
