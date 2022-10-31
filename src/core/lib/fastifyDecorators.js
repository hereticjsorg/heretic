const duplicateErrorData = field => ({
    instancePath: `/${field}`,
    keyword: `duplicate${field[0].toUpperCase()}${field.slice(1)}`,
    message: "Duplicate record",
    tab: "_default",
});

/* eslint-disable object-shorthand */
/* eslint-disable func-names */
export default {
    findDatabaseDuplicates: async function (collection, fields, values, existingRecord) {
        const duplicateRecord = await this.mongo.db.collection(collection).find({
            $or: fields.map(f => {
                const query = {};
                query[f] = values[f];
                return query;
            })
        }).toArray();
        const duplicateErrors = [];
        for (const record of duplicateRecord) {
            if (!existingRecord || record._id.toString() !== existingRecord._id.toString()) {
                for (const field of fields) {
                    if (values[field] && record[field] && record[field] === values[field]) {
                        duplicateErrors.push(duplicateErrorData(field));
                    }
                }
            }
        }
        if (duplicateErrors.length) {
            return {
                message: "duplicateRecord",
                form: duplicateErrors,
            };
        }
        return null;
    }
};
