import {
    ObjectId,
} from "mongodb";
import moduleConfig from "../module.js";

export default () => ({
    async handler(req, rep) {
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (!authData || !authData.groupData || !authData.groupData.find(i => i.id === "admin" && i.value === true)) {
                return rep.error({
                    message: "Access Denied",
                }, 403);
            }
            const multipartData = await req.processMultipart();
            const {
                id,
            } = multipartData.fields;
            const query = {
                userId: authData._id,
                module: moduleConfig.id,
            };
            if (typeof id === "string" && id.match(/^[a-f\d]{24}$/i)) {
                query._id = new ObjectId(id);
            }
            if (!query._id) {
                query.status = "processing";
            }
            const jobData = (await this.mongo.db.collection(this.systemConfig.collections.jobs).findOne(query));
            if (jobData) {
                jobData.id = String(jobData._id);
                delete jobData._id;
            }
            return rep.code(200).send(jobData || {
                status: "cancelled",
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
