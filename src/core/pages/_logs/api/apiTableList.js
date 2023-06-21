import FormData from "../data/form";

export default () => ({
    async handler(req, rep) {
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (!authData || !authData.groupData || !authData.groupData.find(i => i.id === "admin" && i.value === true)) {
                return rep.error({
                    message: "Access Denied",
                }, 403);
            }
            const formData = new FormData();
            const options = req.validateTableList(formData);
            if (!options) {
                return rep.error({
                    message: "validation_error"
                });
            }
            return rep.code(200).send({
                items: [],
                total: 0,
                grandTotal: 0,
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
