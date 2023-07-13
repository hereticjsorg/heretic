import siteConfig from "#etc/system.js";

const id = "events";

export default {
    id,
    routes: {
        userspace: {},
        admin: {
            events: {
                path: "/events",
            },
        }
    },
    collections: {
        events: siteConfig.collections.events,
    },
    options: {
        itemsPerPage: 20,
        lockTimeout: 60,
    },
};
