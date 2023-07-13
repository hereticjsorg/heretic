import siteConfig from "#etc/system.js";

const id = "users";

export default {
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
        }
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
