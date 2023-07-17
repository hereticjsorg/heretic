export default () => ({
    async handler(req, rep) {
        const authData = await req.auth.getData(req.auth.methods.COOKIE);
        if (!authData) {
            return rep.error({
                message: "Access Denied",
            }, 403);
        }
        delete authData.password;
        delete authData.sid;
        delete authData.groupData;
        authData.userId = authData._id;
        delete authData._id;
        authData.sessionId = authData.session._id;
        delete authData.session;
        return rep.success({
            ...authData,
        });
    }
});
