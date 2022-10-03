import Ajv from "ajv";
import {
    startOfDay,
    endOfDay
} from "date-fns";
import {
    ObjectID
} from "bson";
import listValidationSchema from "./listGenericValidationSchema.json";
import recycleBinListValidationSchema from "./recycleBinListGenericValidationSchema.json";
import loadGenericValidationSchema from "./loadGenericValidationSchema.json";
import deleteGenericValidationSchema from "./deleteGenericValidationSchema.json";
import bulkGenericValidationSchema from "./bulkGenericValidationSchema.json";
import exportGenericValidationSchema from "./exportGenericValidationSchema.json";
import historyListGenericValidationSchema from "./historyListGenericValidationSchema.json";
import languages from "../../config/languages.json";

const ajv = new Ajv({
    allErrors: true,
    strict: true,
});
exportGenericValidationSchema.properties.language.enum = Object.keys(languages);

const validateLoadGenericSchema = ajv.compile(loadGenericValidationSchema);
const deleteGenericSchema = ajv.compile(deleteGenericValidationSchema);
const bulkGenericSchema = ajv.compile(bulkGenericValidationSchema);
const exportGenericSchema = ajv.compile(exportGenericValidationSchema);
const recycleBinListGenericSchema = ajv.compile(recycleBinListValidationSchema);
const historyListGenericSchema = ajv.compile(historyListGenericValidationSchema);

/* eslint-disable object-shorthand */
/* eslint-disable func-names */
export default {
    validateTableList: function (formData) {
        const columns = Object.keys(formData.getTableColumns());
        const columnsSortable = Object.keys(Object.fromEntries(Object.entries(formData.getTableColumns()).filter(([, value]) => !!value.sortable)));
        listValidationSchema.properties.fields.items.enum = columns;
        listValidationSchema.properties.sortField.enum = [...columnsSortable, "null"];
        const validate = ajv.compile(listValidationSchema);
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
        return options;
    },
    validateTableRecycleBinList: function () {
        if (!recycleBinListGenericSchema(this.body)) {
            return null;
        }
        return {
            skip: (this.body.page - 1) * this.body.itemsPerPage,
            limit: this.body.itemsPerPage,
        };
    },
    validateDataLoadGeneric: function () {
        return !!validateLoadGenericSchema(this.body);
    },
    validateDataDeleteGeneric: function () {
        return !!deleteGenericSchema(this.body);
    },
    validateDataBulkGeneric: function () {
        return !!bulkGenericSchema(this.body);
    },
    validateDataExportGeneric: function () {
        return !!exportGenericSchema(this.body);
    },
    validateHistoryListGeneric: function () {
        return !!historyListGenericSchema(this.body);
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
                    queryItem[filter.id] = {
                        $eq: filter.value,
                    };
                    break;
                case "neq":
                    queryItem[filter.id] = {
                        $ne: filter.value,
                    };
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
                        queryItem[filter.id] = {
                            $eq: filter.value,
                        };
                        break;
                    case "neq":
                        queryItem[filter.id] = {
                            $ne: filter.value,
                        };
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
    }
};
