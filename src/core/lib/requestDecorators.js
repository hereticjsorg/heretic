import Ajv from "ajv";
import {
    cloneDeep,
} from "lodash";
import {
    startOfDay,
    endOfDay
} from "date-fns";
import {
    ObjectID
} from "bson";
import {
    IPv4,
    IPv6,
} from "ip-num/IPNumber";
import IpTools from "./iptools";
import listValidationSchema from "./data/listValidationSchema.json";
import recycleBinListValidationSchema from "./data/recycleBinListValidationSchema.json";
import loadValidationSchema from "./data/loadValidationSchema.json";
import deleteValidationSchema from "./data/deleteValidationSchema.json";
import bulkValidationSchema from "./data/bulkValidationSchema.json";
import exportValidationSchema from "./data/exportValidationSchema.json";
import historyListValidationSchema from "./data/historyListValidationSchema.json";
import languages from "../../config/languages.json";

const ajv = new Ajv({
    allErrors: true,
    strict: true,
});
exportValidationSchema.properties.language.enum = Object.keys(languages);
const ipTools = new IpTools();

/* eslint-disable object-shorthand */
/* eslint-disable func-names */
export default {
    list: function () {
        return ["validateTableList", "validateDataLoad", "validateDataDelete", "validateDataBulk", "validateDataExport", "validateRecycleBinList", "validateHistoryList", "generateQuery", "bulkUpdateQuery", "processFormData", "processDataList", "findUpdates", "addEvent"];
    },
    validateTableList: function (formData) {
        const columns = Object.keys(formData.getTableColumns());
        const columnsSortable = Object.keys(Object.fromEntries(Object.entries(formData.getTableColumns()).filter(([, value]) => !!value.sortable)));
        const listValidationSchemaClone = cloneDeep(listValidationSchema);
        listValidationSchemaClone.properties.fields.items.enum = columns;
        listValidationSchemaClone.properties.sortField.enum = [...columnsSortable, "null"];
        listValidationSchemaClone.properties.language.enum = Object.keys(languages);
        const validate = ajv.compile(listValidationSchemaClone);
        if (!validate(this.body)) {
            return null;
        }
        const options = {
            sort: {},
        };
        if (this.body.sortField && this.body.sortDirection) {
            options.sort[this.body.sortField] = this.body.sortDirection === "asc" ? 1 : -1;
        } else {
            delete options.sort;
        }
        options.skip = (this.body.page - 1) * this.body.itemsPerPage;
        options.limit = this.body.itemsPerPage;
        options.projection = {};
        columns.map(c => options.projection[c] = 1);
        return options;
    },
    validateRecycleBinList: function () {
        const recycleBinListSchema = ajv.compile(recycleBinListValidationSchema);
        if (!recycleBinListSchema(this.body)) {
            return null;
        }
        return {
            skip: (this.body.page - 1) * this.body.itemsPerPage,
            limit: this.body.itemsPerPage,
        };
    },
    validateDataLoad: function () {
        const validateLoadSchema = ajv.compile(loadValidationSchema);
        return !!validateLoadSchema(this.body);
    },
    validateDataDelete: function () {
        const deleteSchema = ajv.compile(deleteValidationSchema);
        return !!deleteSchema(this.body);
    },
    validateDataBulk: function () {
        const bulkSchema = ajv.compile(bulkValidationSchema);
        return !!bulkSchema(this.body);
    },
    validateDataExport: function () {
        const exportSchema = ajv.compile(exportValidationSchema);
        return !!exportSchema(this.body);
    },
    validateHistoryList: function () {
        const historyListSchema = ajv.compile(historyListValidationSchema);
        return !!historyListSchema(this.body);
    },
    generateQuery: function (formData) {
        const query = {
            $or: [],
            $and: [{
                deleted: {
                    $exists: false,
                },
            }],
        };
        if (this.body.searchText && this.body.searchText.length > 1) {
            for (const k of Object.keys(formData.getFieldsFlat())) {
                const field = formData.getFieldsFlat()[k];
                if (field.searchable) {
                    const s = {};
                    s[k] = {
                        $regex: this.body.searchText,
                        $options: "i",
                    };
                    query.$or.push(s);
                    if (formData.getTabs) {
                        const tabs = formData.getTabs();
                        for (const tab of tabs) {
                            const st = {};
                            st[`${tab.id}.${k}`] = {
                                $regex: this.body.searchText,
                                $options: "i",
                            };
                            query.$or.push(st);
                        }
                    }
                }
            }
        }
        if (this.body.filters && Array.isArray(this.body.filters)) {
            for (const filter of this.body.filters) {
                const queryItem = {};
                switch (filter.mode) {
                case "eq":
                    queryItem.$or = queryItem.$or || [];
                    const qeq = {};
                    qeq[filter.id] = filter.value;
                    queryItem.$or.push(qeq);
                    if (typeof filter.value === "string" && filter.value.match(/^[0-9]+$/)) {
                        const qeqn = {};
                        qeqn[filter.id] = parseInt(filter.value, 10);
                        queryItem.$or.push(qeqn);
                    }
                    break;
                case "neq":
                    queryItem.$and = queryItem.$and || [];
                    const qneq = {};
                    qneq[filter.id] = {
                        $ne: filter.value,
                    };
                    queryItem.$and.push(qneq);
                    if (typeof filter.value === "string" && filter.value.match(/^[0-9]+$/)) {
                        const qneqn = {};
                        qneqn[filter.id] = parseInt(filter.value, 10);
                        queryItem.$and.push(qneqn);
                    }
                    break;
                case "rex":
                    if (filter.value.length > 1) {
                        queryItem[filter.id] = {
                            $regex: `(.*)?${filter.value}(.*)?`,
                            $options: "i",
                        };
                    }
                    break;
                case "nrex":
                    if (filter.value.length > 1) {
                        queryItem[filter.id] = {
                            $not: {
                                $regex: `(.*)?${filter.value}(.*)?`,
                                $options: "i",
                            }
                        };
                    }
                    break;
                case "oof":
                    if (Array.isArray(filter.value)) {
                        queryItem.$or = queryItem.$or || [];
                        for (const item of filter.value) {
                            const qi = {};
                            qi[filter.id] = item;
                            queryItem.$or.push(qi);
                            if (typeof item === "string" && item.match(/^[0-9]+$/)) {
                                const qin = {};
                                qin[filter.id] = parseInt(item, 10);
                                queryItem.$or.push(qin);
                            }
                        }
                    }
                    break;
                case "nof":
                    if (Array.isArray(filter.value)) {
                        for (const item of filter.value) {
                            const qi = {};
                            qi[filter.id] = {
                                $ne: item,
                            };
                            query.$and.push(qi);
                            if (typeof item === "string" && item.match(/^[0-9]+$/)) {
                                const qin = {};
                                qin[filter.id] = {
                                    $ne: parseInt(item, 10),
                                };
                                query.$and.push(qin);
                            }
                        }
                    }
                    break;
                case "deq":
                    if (filter.value) {
                        const deqDate = new Date(filter.value * 1000);
                        const deqDateStart = startOfDay(deqDate);
                        const deqDateEnd = endOfDay(deqDate);
                        const deqDateStartQuery = {};
                        deqDateStartQuery[filter.id] = {
                            $gte: deqDateStart,
                        };
                        const deqDateEndQuery = {};
                        deqDateEndQuery[filter.id] = {
                            $lte: deqDateEnd,
                        };
                        query.$and.push(deqDateStartQuery);
                        query.$and.push(deqDateEndQuery);
                    } else {
                        const deqDateNullQuery = {};
                        deqDateNullQuery[filter.id] = {
                            $eq: null,
                        };
                        query.$and.push(deqDateNullQuery);
                    }
                    break;
                case "dlt":
                    if (filter.value) {
                        const dltDate = new Date(filter.value * 1000);
                        const dltDateStart = startOfDay(dltDate);
                        const dltDateStartQuery = {};
                        dltDateStartQuery[filter.id] = {
                            $lt: dltDateStart,
                        };
                        query.$and.push(dltDateStartQuery);
                    } else {
                        const dltDateNullQuery = {};
                        dltDateNullQuery[filter.id] = {
                            $eq: null,
                        };
                        query.$and.push(dltDateNullQuery);
                    }
                    break;
                case "dlte":
                    if (filter.value) {
                        const dlteDate = new Date(filter.value * 1000);
                        const dlteDateStart = endOfDay(dlteDate);
                        const dlteDateStartQuery = {};
                        dlteDateStartQuery[filter.id] = {
                            $lte: dlteDateStart,
                        };
                        query.$and.push(dlteDateStartQuery);
                    } else {
                        const dlteDateNullQuery = {};
                        dlteDateNullQuery[filter.id] = {
                            $eq: null,
                        };
                        query.$and.push(dlteDateNullQuery);
                    }
                    break;
                case "dgt":
                    if (filter.value) {
                        const dgtDate = new Date(filter.value * 1000);
                        const dgtDateStart = endOfDay(dgtDate);
                        const dgtDateStartQuery = {};
                        dgtDateStartQuery[filter.id] = {
                            $gt: dgtDateStart,
                        };
                        query.$and.push(dgtDateStartQuery);
                    } else {
                        const dgtDateNullQuery = {};
                        dgtDateNullQuery[filter.id] = {
                            $eq: null,
                        };
                        query.$and.push(dgtDateNullQuery);
                    }
                    break;
                case "dgte":
                    if (filter.value) {
                        const dgteDate = new Date(filter.value * 1000);
                        const dgteDateStart = startOfDay(dgteDate);
                        const dgteDateStartQuery = {};
                        dgteDateStartQuery[filter.id] = {
                            $gte: dgteDateStart,
                        };
                        query.$and.push(dgteDateStartQuery);
                    } else {
                        const dgteDateNullQuery = {};
                        dgteDateNullQuery[filter.id] = {
                            $eq: null,
                        };
                        query.$and.push(dgteDateNullQuery);
                    }
                    break;
                }
                if (Object.keys(queryItem).length) {
                    query.$and.push(queryItem);
                }
            }
        }
        if (!query.$or.length) {
            delete query.$or;
        }
        return query;
    },
    processFormData: function (data, fields, tabs = [{
        id: "_default",
    }]) {
        for (const tab of tabs) {
            if (data[tab.id]) {
                for (const k of Object.keys(data[tab.id])) {
                    if (fields[k]) {
                        switch (fields[k].type) {
                        case "date":
                            data[tab.id][k] = data[tab.id][k] && data[tab.id][k].getTime ? data[tab.id][k].getTime() / 1000 : null;
                            break;
                        }
                    }
                }
            }
        }
        return data;
    },
    processDataList: function (data, fields) {
        for (const item of data) {
            for (const k of Object.keys(item)) {
                if (fields[k]) {
                    switch (fields[k].type) {
                    case "date":
                        item[k] = item[k] && item[k].getTime ? item[k].getTime() / 1000 : null;
                        break;
                    }
                }
            }
        }
        return data;
    },
    bulkUpdateQuery: function (formData) {
        const query = {
            $or: [],
            $and: [],
        };
        if (this.body.selected && this.body.selected.length) {
            for (const item of this.body.selected) {
                query.$or.push({
                    _id: new ObjectID(item),
                });
            }
        } else {
            if (this.body.searchText && this.body.searchText.length > 1) {
                for (const k of Object.keys(formData.getFieldsFlat())) {
                    const field = formData.getFieldsFlat()[k];
                    if (field.searchable) {
                        const s = {};
                        s[k] = {
                            $regex: this.body.searchText,
                            $options: "i",
                        };
                        query.$or.push(s);
                        if (formData.getTabs) {
                            const tabs = formData.getTabs();
                            for (const tab of tabs) {
                                const st = {};
                                st[`${tab.id}.${k}`] = {
                                    $regex: this.body.searchText,
                                    $options: "i",
                                };
                                query.$or.push(st);
                            }
                        }
                    }
                }
            }
            if (this.body.filters && Array.isArray(this.body.filters)) {
                for (const filter of this.body.filters) {
                    const queryItem = {};
                    switch (filter.mode) {
                    case "eq":
                        queryItem.$or = queryItem.$or || [];
                        const qeq = {};
                        qeq[filter.id] = filter.value;
                        queryItem.$or.push(qeq);
                        if (typeof filter.value === "string" && filter.value.match(/^[0-9]+$/)) {
                            const qeqn = {};
                            qeqn[filter.id] = parseInt(filter.value, 10);
                            queryItem.$or.push(qeqn);
                        }
                        break;
                    case "neq":
                        queryItem.$and = queryItem.$and || [];
                        const qneq = {};
                        qneq[filter.id] = {
                            $ne: filter.value,
                        };
                        queryItem.$and.push(qneq);
                        if (typeof filter.value === "string" && filter.value.match(/^[0-9]+$/)) {
                            const qneqn = {};
                            qneqn[filter.id] = parseInt(filter.value, 10);
                            queryItem.$and.push(qneqn);
                        }
                        break;
                    case "rex":
                        if (filter.value.length > 1) {
                            queryItem[filter.id] = {
                                $regex: `(.*)?${filter.value}(.*)?`,
                                $options: "i",
                            };
                        }
                        break;
                    case "nrex":
                        if (filter.value.length > 1) {
                            queryItem[filter.id] = {
                                $not: {
                                    $regex: `(.*)?${filter.value}(.*)?`,
                                    $options: "i",
                                }
                            };
                        }
                        break;
                    case "oof":
                        if (Array.isArray(filter.value)) {
                            queryItem.$or = queryItem.$or || [];
                            for (const item of filter.value) {
                                const qi = {};
                                qi[filter.id] = item;
                                queryItem.$or.push(qi);
                            }
                        }
                        break;
                    case "nof":
                        if (Array.isArray(filter.value)) {
                            for (const item of filter.value) {
                                const qi = {};
                                qi[filter.id] = {
                                    $ne: item,
                                };
                                query.$and.push(qi);
                            }
                        }
                        break;
                    case "deq":
                        if (filter.value) {
                            const deqDate = new Date(filter.value * 1000);
                            const deqDateStart = startOfDay(deqDate);
                            const deqDateEnd = endOfDay(deqDate);
                            const deqDateStartQuery = {};
                            deqDateStartQuery[filter.id] = {
                                $gte: deqDateStart,
                            };
                            const deqDateEndQuery = {};
                            deqDateEndQuery[filter.id] = {
                                $lte: deqDateEnd,
                            };
                            query.$and.push(deqDateStartQuery);
                            query.$and.push(deqDateEndQuery);
                        } else {
                            const deqDateNullQuery = {};
                            deqDateNullQuery[filter.id] = {
                                $eq: null,
                            };
                            query.$and.push(deqDateNullQuery);
                        }
                        break;
                    case "dlt":
                        if (filter.value) {
                            const dltDate = new Date(filter.value * 1000);
                            const dltDateStart = startOfDay(dltDate);
                            const dltDateStartQuery = {};
                            dltDateStartQuery[filter.id] = {
                                $lt: dltDateStart,
                            };
                            query.$and.push(dltDateStartQuery);
                        } else {
                            const dltDateNullQuery = {};
                            dltDateNullQuery[filter.id] = {
                                $eq: null,
                            };
                            query.$and.push(dltDateNullQuery);
                        }
                        break;
                    case "dlte":
                        if (filter.value) {
                            const dlteDate = new Date(filter.value * 1000);
                            const dlteDateStart = endOfDay(dlteDate);
                            const dlteDateStartQuery = {};
                            dlteDateStartQuery[filter.id] = {
                                $lte: dlteDateStart,
                            };
                            query.$and.push(dlteDateStartQuery);
                        } else {
                            const dlteDateNullQuery = {};
                            dlteDateNullQuery[filter.id] = {
                                $eq: null,
                            };
                            query.$and.push(dlteDateNullQuery);
                        }
                        break;
                    case "dgt":
                        if (filter.value) {
                            const dgtDate = new Date(filter.value * 1000);
                            const dgtDateStart = endOfDay(dgtDate);
                            const dgtDateStartQuery = {};
                            dgtDateStartQuery[filter.id] = {
                                $gt: dgtDateStart,
                            };
                            query.$and.push(dgtDateStartQuery);
                        } else {
                            const dgtDateNullQuery = {};
                            dgtDateNullQuery[filter.id] = {
                                $eq: null,
                            };
                            query.$and.push(dgtDateNullQuery);
                        }
                        break;
                    case "dgte":
                        if (filter.value) {
                            const dgteDate = new Date(filter.value * 1000);
                            const dgteDateStart = startOfDay(dgteDate);
                            const dgteDateStartQuery = {};
                            dgteDateStartQuery[filter.id] = {
                                $gte: dgteDateStart,
                            };
                            query.$and.push(dgteDateStartQuery);
                        } else {
                            const dgteDateNullQuery = {};
                            dgteDateNullQuery[filter.id] = {
                                $eq: null,
                            };
                            query.$and.push(dgteDateNullQuery);
                        }
                        break;
                    }
                    if (Object.keys(queryItem).length) {
                        query.$and.push(queryItem);
                    }
                }
            }
        }
        if (!query.$or.length) {
            delete query.$or;
        }
        if (!query.$and.length) {
            delete query.$and;
        }
        return query;
    },
    findUpdates: async function (formData, oldRecord, newRecord, options = {}) {
        const tabs = formData.getTabs ? formData.getTabs() : [{
            id: "_default",
        }];
        const modifiedItems = [];
        for (const tab of tabs) {
            const dataOld = tab.id === "_default" ? oldRecord : oldRecord[tab];
            const dataNew = tab.id === "_default" ? newRecord : newRecord[tab];
            for (const item of Object.keys(dataOld)) {
                if (options && options.ignore && options.ignore.indexOf(item) > -1) {
                    continue;
                }
                if (JSON.stringify(dataOld[item]) !== JSON.stringify(dataNew[item])) {
                    modifiedItems.push({
                        tab: tab.id,
                        id: item,
                        valueOld: dataOld[item],
                        valueNew: dataNew[item],
                    });
                }
            }
        }
        return modifiedItems;
    },
    async addEvent(event, authData = {}, extras = {}) {
        const clientIp = ipTools.getClientIp(this) || null;
        let clientIpInt = null;
        let geoNameIdCity = null;
        let geoNameIdCountry = null;
        if (clientIp && ipTools.isIP(clientIp) && clientIp !== "127.0.0.1") {
            const clientIpVersion = ipTools.getIPVersion(clientIp);
            const clientIpData = clientIpVersion === 6 ? new IPv6(clientIp) : new IPv4(clientIp);
            clientIpInt = clientIpVersion === 6 ? clientIpData.value : parseInt(clientIpData.value, 10);
            const geoRecord = await this.fastify.mongo.db.collection(this.fastify.systemConfig.collections.geoNetworks).findOne({
                blockEnd: {
                    $gte: clientIpInt,
                },
            }, {
                sort: {
                    blockEnd: 1,
                },
                projection: {
                    geoNameIdCity: 1,
                    geoNameIdCountry: 1,
                },
            });
            if (geoRecord) {
                if (geoRecord.geoNameIdCity) {
                    geoNameIdCity = geoRecord.geoNameIdCity;
                }
                if (geoRecord.geoNameIdCountry) {
                    geoNameIdCountry = geoRecord.geoNameIdCountry;
                }
            }
        }
        await this.fastify.mongo.db.collection(this.fastify.systemConfig.collections.events).insertOne({
            event,
            userId: authData && authData._id ? String(authData._id) : null,
            username: authData && authData.username ? authData.username : null,
            date: new Date(),
            ip: clientIp,
            geoNameIdCity,
            geoNameIdCountry,
            extras: Object.keys(extras).length ? extras : null,
        });
    }
};
