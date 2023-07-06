const id = "sessions";
const siteConfig = require("#etc/system.js");

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
