const siteConfig = require("#etc/system.js");

const id = "users";

module.exports = {
    id,
    routes: {
        userspace: {},
        admin: {
            users: {
                path: "/users",
            },
            groups: {
                path: "/groups",
            },
        },
    },
    collections: {
        users: siteConfig.collections.users,
        groups: siteConfig.collections.groups,
    },
    options: {
        itemsPerPage: 20,
        lockTimeout: 60,
    },
    api: {
        activate: "/api/user/activate",
        setPassword: "/api/user/password/set",
    },
};
