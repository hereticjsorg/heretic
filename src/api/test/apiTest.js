export default () => ({
    async handler(req, rep) {
        try {
            const formData = await req.processMultipart();
            return rep.code(200).send({
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
