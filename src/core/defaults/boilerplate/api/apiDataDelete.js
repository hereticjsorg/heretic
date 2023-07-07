import {
    ObjectId
} from "mongodb";
import FormData from "../data/form";
import moduleConfig from "../module.js";
import utils from "./utils.js";

export default () => ({
    async handler(req, rep) {
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (!authData) {
                return rep.error({}, 403);
            }
            if (!req.validateDataDelete()) {
                return rep.error({
                    message: "validation_error"
                });
            }
            if (!this.systemConfig.demo) {
                const formData = new FormData();
                const query = {
                    $and: [{
                        $or: [],
                    }, {
                        ...(utils.filter({}, authData) || {}),
                    }],
                };
                for (const id of req.body.ids) {
                    query.$and[0].$or.push({
                        _id: new ObjectId(id)
                    });
                }
                if (formData.getRecycleBinConfig && formData.getRecycleBinConfig().enabled) {
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
                const deleteResult = await this.mongo.db.collection(moduleConfig.collections.main).deleteMany(query);
                return rep.code(200).send({
                    count: deleteResult.deletedCount,
                });
            }
            return rep.code(200).send({
                count: 0,
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
