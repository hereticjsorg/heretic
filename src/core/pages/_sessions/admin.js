const id = "_sessions";
const siteConfig = require("#etc/system.js");
const meta = require("./meta.json");

module.exports = {
    id,
    path: "/sessions",
    icon: "mdiCardAccountDetailsOutline",
    collections: {
        main: siteConfig.collections.sessions,
    },
    options: {
        itemsPerPage: 20,
        lockTimeout: 60,
    },
    ...meta.admin,
};
