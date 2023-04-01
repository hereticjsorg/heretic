export default () => ({
    async handler(req, rep) {
        try {
            const {
                id,
            } = req.body;
            if (!id || typeof id !== "string" || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)) {
                return rep.error({
                    message: "Invalid ID",
                });
            }
            return rep.success({
                type: "email",
                value: "xtreme@rh1.ru",
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
