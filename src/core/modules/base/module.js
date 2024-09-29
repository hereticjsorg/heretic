const id = "base";

module.exports = {
    id,
    routes: {
        userspace: {
            status: {
                path: "/_status",
            },
            search: {
                path: "/search",
            },
        },
        admin: {
            home: {
                path: "",
            },
        },
    },
    maxUploadImageSize: 10 * 1024 * 1024, // 10 MB
};
