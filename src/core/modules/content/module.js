const siteConfig = require("#etc/system.js");

const id = "content";

module.exports = {
    id,
    routes: {
        userspace: {},
        admin: {
            list: {
                path: "/content",
            },
            edit: {
                path: "/content/edit",
            },
        },
    },
    collections: {
        content: siteConfig.collections.content,
    },
    options: {
        itemsPerPage: 20,
        lockTimeout: 60,
    },
};
