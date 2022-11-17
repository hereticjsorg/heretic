import {
    ObjectId
} from "mongodb";

export default () => ({
    async handler(req, rep) {
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (!authData) {
                return rep.error({
                    message: "Access Denied",
                }, 403);
            }
            await this.mongo.db.collection(this.systemConfig.collections.users).updateOne({
                _id: new ObjectId(authData._id),
            }, {
                $unset: {
                    sid: null,
                },
            }, {
                upsert: false,
            });
            return rep.success({});
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
