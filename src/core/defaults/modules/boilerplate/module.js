const id = "boilerplate";

module.exports = {
    id,
    routes: {
        userspace: {
            list: {
                path: `/${id}`,
            },
            edit: {
                path: `/${id}/edit`,
            },
        },
        admin: {},
    },
    collections: {
        main: id,
    },
    options: {
        itemsPerPage: 20,
        lockTimeout: 60,
    },
};
