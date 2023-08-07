import {
    ObjectId
} from "mongodb";
import path from "path";
import fs from "fs-extra";
import Ajv from "ajv";

export default class {
    constructor(schema, fields, fastify) {
        this.schema = schema;
        this.fields = fields;
        this.fastify = fastify;
        this.ajv = new Ajv({
            allErrors: true,
            strict: false,
        });
        this.validateSchema = this.ajv.compile(this.schema);
        this.data = {};
    }

    parseMultipartData(multipartData) {
        this.formTabs = JSON.parse(multipartData.fields.formTabs);
        this.formFiles = multipartData.files || {};
        this.formShared = JSON.parse(multipartData.fields.formShared);
        this.tabs = JSON.parse(multipartData.fields.tabs);
        for (const tab of this.tabs) {
            this.data[tab] = this.formTabs[tab];
            for (const fsk of Object.keys(this.formShared)) {
                this.data[tab][fsk] = this.formShared[fsk];
            }
        }
        if (multipartData.fields.id) {
            const id = String(multipartData.fields.id);
            if (id) {
                try {
                    if (id.match(/^[0-9]{1,9007199254740991}$/)) {
                        this.data._id = parseInt(id, 10);
                    }
                    if (id.match(/^[a-f0-9]{24}$/)) {
                        this.data._id = new ObjectId(id);
                    }
                } catch {
                    this.data._id = null;
                }
            }
        }
        return {
            data: this.data,
            tabs: this.tabs,
        };
    }

    processValue(type, value) {
        switch (type) {
        case "date":
            return value && parseInt(value, 10) ? new Date(value * 1000) : null;
        default:
            return value;
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
        const filesFields = Object.keys(this.fields).find(k => this.fields[k] && this.fields[k].type === "files");
        for (const ff of (Array.isArray(filesFields) ? filesFields : [filesFields])) {
            const filesSchema = this.schema.properties[ff];
            for (const tab of this.tabs) {
                const filesData = this.data[tab][ff] ? (Array.isArray(this.data[tab][ff]) ? this.data[tab][ff] : [this.data[tab][ff]]) : [];
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
                        if (this.formFiles[file.uid]) {
                            const fileData = this.formFiles[file.uid];
                            if (typeof filesSchema.maxSize === "number" && fileData.size > filesSchema.maxSize) {
                                resultArr.push({
                                    instancePath: ff,
                                    keyword: "filesMaxSize",
                                    tab,
                                });
                                break;
                            }
                            if (Array.isArray(filesSchema.extensions) && filesSchema.extensions.length) {
                                const ext = fileData.filename.filename.split(".").pop() || "";
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
        }
        if (!resultArr.length && this.fields) {
            for (const tab of this.tabs) {
                if (this.data[tab]) {
                    for (const k of Object.keys(this.data[tab])) {
                        if (this.fields[k]) {
                            this.data[tab][k] = this.processValue(this.fields[k].type, this.data[tab][k]);
                        }
                    }
                }
            }
        }
        return resultArr.length ? resultArr : null;
    }

    validateImport(data) {
        const resultArr = [];
        const result = this.validateSchema(data);
        if (!result) {
            for (const item of this.validateSchema.errors) {
                resultArr.push({
                    ...item,
                });
            }
        }
        return resultArr;
    }

    async saveFiles(page = null, refId = null) {
        const filesFields = Object.keys(this.fields).find(k => this.fields[k].type === "files");
        for (const ff of (Array.isArray(filesFields) ? filesFields : [filesFields])) {
            for (const tab of this.tabs) {
                const filesData = this.data[tab][ff] ? (Array.isArray(this.data[tab][ff]) ? this.data[tab][ff] : [this.data[tab][ff]]) : [];
                for (const file of filesData) {
                    if (this.formFiles[file.uid] && !this.fastify.systemConfig.demo) {
                        try {
                            await fs.move(this.formFiles[file.uid].filePath, `${path.resolve(__dirname, this.fastify.systemConfig.directories.files)}/${file.uid}`);
                            if (this.fastify.systemConfig.mongo.enabled) {
                                await this.fastify.mongo.db.collection(this.fastify.systemConfig.collections.files).insertOne({
                                    _id: file.uid,
                                    filename: this.formFiles[file.uid].filename,
                                    size: this.formFiles[file.uid].size,
                                    mimeType: this.formFiles[file.uid].mimeType,
                                    page,
                                    refId,
                                });
                            }
                        } catch {
                            // Ignore
                        }
                    }
                }
            }
        }
    }

    async unlinkRemovedFiles(currentItem) {
        const filesFields = Object.keys(this.fields).find(k => this.fields[k].type === "files");
        const removedUIDs = [];
        for (const ff of (Array.isArray(filesFields) ? filesFields : [filesFields])) {
            for (const tab of this.tabs) {
                const filesDataCurrent = currentItem[tab][ff] ? (Array.isArray(currentItem[tab][ff]) ? currentItem[tab][ff] : [currentItem[tab][ff]]) : [];
                const filesDataNew = this.data[tab][ff] ? (Array.isArray(this.data[tab][ff]) ? this.data[tab][ff] : [this.data[tab][ff]]) : [];
                for (const oldItem of filesDataCurrent) {
                    if (!filesDataNew.find(i => i.uid === oldItem.uid)) {
                        removedUIDs.push(oldItem.uid);
                    }
                }
            }
        }
        const deleteManyQuery = {
            $or: []
        };
        for (const _id of removedUIDs) {
            deleteManyQuery.$or.push({
                _id,
            });
            try {
                await fs.unlink(`${path.resolve(__dirname, this.fastify.systemConfig.directories.files)}/${_id}`);
            } catch {
                // Ignore
            }
        }
        if (this.fastify.systemConfig.mongo.enabled) {
            try {
                await this.fastify.mongo.db.collection(this.fastify.systemConfig.collections.files).deleteMany(deleteManyQuery);
            } catch {
                // Ignore
            }
        }
    }

    async cleanUpFiles() {
        if (this.formFiles && typeof this.formFiles === "object") {
            for (const k of Object.keys(this.formFiles)) {
                try {
                    try {
                        await fs.unlink(this.formFiles[k].filePath);
                    } catch {
                        // Ignore
                    }
                } catch {
                    // Ignore
                }
            }
        }
    }
}
