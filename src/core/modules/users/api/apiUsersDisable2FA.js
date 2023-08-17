export default () => ({
    async handler(req, rep) {
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (!authData || !authData.groupData || !authData.groupData.find(i => i.id === "admin" && i.value === true)) {
                return rep.error({
                    message: "Access Denied",
                }, 403);
            }
            if (!this.systemConfig.demo) {
                await this.mongo.db.collection(this.systemConfig.collections.users).updateOne({
                    _id: authData._id,
                }, {
                    $unset: {
                        tfaConfig: null,
                    },
                });
            }
            return rep.code(200).send({});
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
