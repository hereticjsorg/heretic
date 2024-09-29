import moduleConfig from "../module.js";

export default () => ({
    async handler(req, rep) {
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (!authData) {
                return rep.error({}, 403);
            }
            const query = {
                deleted: {
                    $exists: true,
                },
            };
            await this.mongo.db
                .collection(moduleConfig.collections.main)
                .deleteMany(query);
            return rep.code(200).send({});
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    },
});
