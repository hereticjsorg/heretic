const id = "base";

module.exports = {
    id,
    routes: {
        userspace: {
            status: {
                path: "/_status"
            }
        },
        admin: {
            home: {
                path: "",
            },
        }
    },
};
