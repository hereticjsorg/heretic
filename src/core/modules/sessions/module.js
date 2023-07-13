import siteConfig from "#etc/system.js";

const id = "sessions";

export default {
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
