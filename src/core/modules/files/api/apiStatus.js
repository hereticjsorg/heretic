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
            // eslint-disable-next-line no-console
            console.log(query);
            const jobData = (await this.mongo.db.collection(this.systemConfig.collections.jobs).findOne(query));
            if (jobData) {
                jobData.id = String(jobData._id);
                delete jobData._id;
            }
            return rep.code(200).send(jobData || {});
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
