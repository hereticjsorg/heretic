const id = "files";

module.exports = {
    id,
    routes: {
        userspace: {},
        admin: {
            list: {
                path: "/files",
            },
        }
    },
    root: "",
    maxFileEditSizeBytes: 1048576, // 1 MB
};
