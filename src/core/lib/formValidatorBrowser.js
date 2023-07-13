import Ajv from "ajv";

export default class {
    constructor(schema, fields) {
        this.schema = schema;
        this.fields = fields;
        this.ajv = new Ajv({
            allErrors: true,
            strict: false,
        });
        if (schema) {
            this.validateSchema = this.ajv.compile(this.schema);
        }
    }

    validate(data, tab) {
        if (!this.validateSchema) {
            return;
        }
        const result = this.validateSchema(data);
        const resultArr = [];
        if (!result) {
            for (const item of this.validateSchema.errors) {
                resultArr.push({
                    ...item,
                    tab
                });
            }
        }
        const filesFields = Object.keys(this.fields).find(k => this.fields[k].type === "files");
        for (const ff of (Array.isArray(filesFields) ? filesFields : [filesFields])) {
            const filesSchema = this.schema.properties[ff];
            const filesData = data[ff] ? (Array.isArray(data[ff]) ? data[ff] : [data[ff]]) : [];
            if (filesSchema) {
                // minCount
                if (typeof filesSchema.minCount === "number" && filesData.length < filesSchema.minCount) {
                    resultArr.push({
                        instancePath: ff,
                        keyword: "filesMinCount",
                        tab,
                    });
                    continue;
                }
                // maxCount
                if (typeof filesSchema.maxCount === "number" && filesData.length > filesSchema.maxCount) {
                    resultArr.push({
                        instancePath: ff,
                        keyword: "filesMaxCount",
                        tab,
                    });
                    continue;
                }
                for (const file of filesData) {
                    if (file.data) {
                        const fileData = file.data;
                        if (typeof filesSchema.maxSize === "number" && fileData.size > filesSchema.maxSize) {
                            resultArr.push({
                                instancePath: ff,
                                keyword: "filesMaxSize",
                                tab,
                            });
                            break;
                        }
                        if (Array.isArray(filesSchema.extensions) && filesSchema.extensions.length) {
                            const ext = file.name.split(".").pop() || "";
                            if (!filesSchema.extensions.find(e => e.toLowerCase() === ext.toLowerCase())) {
                                resultArr.push({
                                    instancePath: ff,
                                    keyword: "filesBadExtension",
                                    tab,
                                });
                                break;
                            }
                        }
                    }
                }
            }
        }
        return resultArr.length ? resultArr : null;
    }
}
