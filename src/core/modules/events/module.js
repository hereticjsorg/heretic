const id = "events";
const siteConfig = require("#etc/system.js");

module.exports = {
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
