export default () => ({
    async handler(req, rep) {
        const authData = await req.auth.getData(req.auth.methods.HEADERS);
        if (
            !authData ||
            !authData.groupData ||
            !authData.groupData.find(
                (i) => i.id === "admin" && i.value === true,
            )
        ) {
            return rep.error(
                {
                    message: "Access Denied",
                },
                403,
            );
        }
        try {
            const groups = await this.mongo.db
                .collection(this.systemConfig.collections.groups)
                .find(
                    {},
                    {
                        projection: {
                            _id: 1,
                            group: 1,
                        },
                    },
                )
                .toArray();
            return rep.success({
                groups: groups.map((i) => i.group),
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    },
});
