import Ajv from "ajv";
import moduleConfig from "../admin.js";
import deleteValidationSchema from "../data/deleteValidationSchema.json";

const ajv = new Ajv({
    allErrors: true,
    strict: true,
});
const deleteSchema = ajv.compile(deleteValidationSchema);

export default () => ({
    async handler(req, rep) {
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (!authData || !authData.groupData || !authData.groupData.find(i => i.id === "admin" && i.value === true)) {
                return rep.error({
                    message: "Access Denied",
                }, 403);
            }
            if (!deleteSchema(req.body)) {
                return rep.error({
                    message: "validation_error"
                });
            }
            const query = {
                $or: []
            };
            for (const id of req.body.ids) {
                query.$or.push({
                    _id: id,
                });
            }
            if (moduleConfig.recycleBin && moduleConfig.recycleBin.enabled && !this.systemConfig.demo) {
                const updateResult = await this.mongo.db.collection(moduleConfig.collections.main).updateMany(query, {
                    $set: {
                        deleted: {
                            date: new Date(),
                            userId: authData._id.toString(),
                        },
                    }
                });
                return rep.code(200).send({
                    count: updateResult.modifiedCount,
                });
            }
            const deleteResult = this.systemConfig.demo ? {
                deletedCount: 0,
            } : await this.mongo.db.collection(moduleConfig.collections.main).deleteMany(query);
            return rep.code(200).send({
                count: deleteResult.deletedCount,
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
