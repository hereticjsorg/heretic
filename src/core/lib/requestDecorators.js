import Ajv from "ajv";
import listValidationSchema from "./listGenericValidationSchema.json";
import loadGenericValidationSchema from "./loadGenericValidationSchema.json";
import deleteGenericValidationSchema from "./deleteGenericValidationSchema.json";

const ajv = new Ajv({
    allErrors: true,
    strict: true,
});

const validateLoadGenericSchema = ajv.compile(loadGenericValidationSchema);
const deleteLoadGenericSchema = ajv.compile(deleteGenericValidationSchema);

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
    validateDataLoadGeneric: function () {
        return !!validateLoadGenericSchema(this.body);
    },
    validateDataDeleteGeneric: function () {
        return !!deleteLoadGenericSchema(this.body);
    },
    generateSearchText: function (formData, query = {
        $or: [],
    }) {
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
        return query;
    }
};
