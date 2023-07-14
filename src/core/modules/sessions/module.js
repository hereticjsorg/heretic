const siteConfig = require("#etc/system.js");

const id = "sessions";

module.exports = {
    id,
    routes: {
        userspace: {},
        admin: {
            sessions: {
                path: "/sessions",
            },
        }
    },
    collections: {
        sessions: siteConfig.collections.sessions,
    },
    options: {
        itemsPerPage: 20,
        lockTimeout: 60,
    },
};
