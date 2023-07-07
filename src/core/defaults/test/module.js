const id = "test";

module.exports = {
    id,
    routes: {
        userspace: {
            page: {
                path: `/${id}`,
            },
        },
        admin: {}
    },
};
