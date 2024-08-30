const id = "logs";

module.exports = {
    id,
    routes: {
        userspace: {},
        admin: {
            logs: {
                path: "/logs",
            },
        },
    },
};
