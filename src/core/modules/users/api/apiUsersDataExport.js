import {
    ObjectId,
} from "mongodb";
import fs from "fs-extra";
import path from "path";
import {
    v4 as uuid,
} from "uuid";
import {
    add,
    formatISO,
} from "date-fns";
import xlsx from "#lib/3rdparty/node-xlsx/index.ts";
import FormData from "../data/usersForm";
import languages from "#etc/languages.json";
import moduleConfig from "../module.js";

const dataId = "users";
const translation = {};
for (const language of Object.keys(languages)) {
    translation[language] = require(`../translations/${language}.json`);
}

const buildExcelAsync = async (data, options = {}) => new Promise((resolve) => {
    const buffer = xlsx.build([{
        name: "Export",
        data,
    }], options);
    resolve(buffer);
});

const buildTabSeparatedAsync = async data => new Promise((resolve) => {
    let content = "";
    for (const line of data) {
        const processed = [];
        for (const item of line) {
            if (item instanceof Date && !Number.isNaN(item)) {
                processed.push(formatISO(item));
            } else {
                processed.push(item);
            }
        }
        content += `${processed.join("\t")}\n`;
    }
    resolve(content);
});

export default () => ({
    async handler(req, rep) {
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (this.systemConfig.demo || !authData || !authData.groupData || !authData.groupData.find(i => i.id === "admin" && i.value === true)) {
                return rep.error({
                    message: "Access Denied",
                }, 403);
            }
            if (!req.validateDataExport()) {
                return rep.error({
                    message: "validation_error"
                });
            }
            const t = (id, d = {}) => typeof translation[req.body.language][id] === "function" ? translation[req.body.language][id](d) : translation[req.body.language][id] || id;
            const formData = new FormData(t);
            const columnsFormData = Object.keys(formData.getTableColumns());
            for (const column of req.body.columns) {
                if (columnsFormData.indexOf(column) === -1) {
                    return rep.error({
                        message: "validation_error"
                    });
                }
            }
            const columnTitles = req.body.columns.map(c => formData.getTableColumns()[c].label);
            const query = {
                $or: [],
            };
            for (const id of req.body.selected) {
                query.$or.push({
                    _id: new ObjectId(id),
                });
            }
            const options = {
                projection: {},
            };
            for (const column of req.body.columns) {
                options.projection[column] = 1;
            }
            const records = await this.mongo.db.collection(moduleConfig.collections.users).find(query, options).toArray();
            const data = [columnTitles];
            for (const item of records) {
                const dataItem = [];
                for (const column of req.body.columns) {
                    dataItem.push(formData.processTableCell(column, item));
                }
                data.push(dataItem);
            }
            const dbData = {};
            const uid = uuid();
            switch (req.body.format) {
            case "excel":
                dbData.filename = "export.xlsx";
                dbData.mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                const fileDataExcel = await buildExcelAsync(data);
                dbData.size = fileDataExcel.length;
                await fs.writeFile(path.resolve(__dirname, this.systemConfig.directories.files, uid), fileDataExcel);
                break;
            case "tsv":
                dbData.filename = "export.tsv";
                dbData.mimeType = "text/tab-separated-values";
                const fileDataTSV = await buildTabSeparatedAsync(data);
                dbData.size = fileDataTSV.length;
                await fs.writeFile(path.resolve(__dirname, this.systemConfig.directories.files, uid), fileDataTSV, "utf8");
                break;
            }
            await this.mongo.db.collection(this.systemConfig.collections.files).insertOne({
                _id: uid,
                filename: dbData.filename,
                size: dbData.size,
                mimeType: dbData.mimeType,
                module: dataId,
                validUntil: add(new Date(), {
                    hours: 1
                }),
            });
            return rep.code(200).send({
                uid,
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
