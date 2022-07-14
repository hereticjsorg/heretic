const Ajv = require("ajv");

export default class {
    constructor(schema, fields) {
        this.schema = schema;
        this.fields = fields;
        this.ajv = new Ajv({
            allErrors: true,
            strict: false,
        });
        this.validateSchema = this.ajv.compile(this.schema);
        this.data = {};
    }

    parseMultipartData(multipartData) {
        this.formTabs = JSON.parse(multipartData.fields.formTabs);
        this.formShared = JSON.parse(multipartData.fields.formShared);
        this.tabs = JSON.parse(multipartData.fields.tabs);
        for (const tab of this.tabs) {
            this.data[tab] = this.formTabs[tab];
            for (const fsk of Object.keys(this.formShared)) {
                this.data[tab][fsk] = this.formShared[fsk];
            }
        }
    }

    validate() {
        const resultArr = [];
        for (const tab of this.tabs) {
            const result = this.validateSchema(this.data[tab]);
            if (!result) {
                for (const item of this.validateSchema.errors) {
                    resultArr.push({
                        ...item,
                        tab
                    });
                }
            }
        }
        return resultArr.length ? resultArr : null;
    }
}
