import {
    ObjectId,
} from "mongodb";
import moduleConfig from "../module.js";

export default () => ({
    async handler(req, rep) {
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (!authData) {
                return rep.error({}, 403);
            }
            const multipartData = await req.processMultipart();
            if (typeof multipartData.fields.id !== "string" || !multipartData.fields.id.match(/^[a-f\d]{24}$/i)) {
                return rep.error({
                    message: "Invalid job ID",
                });
            }
            const _id = new ObjectId(multipartData.fields.id);
            await this.mongo.db.collection(this.systemConfig.collections.jobs).updateOne({
                _id,
                userId: authData._id,
                module: moduleConfig.id,
            }, {
                $set: {
                    status: "cancelled",
                    updatedAt: new Date(),
                }
            }, {
                upsert: false,
            });
            return rep.code(200).send({});
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
