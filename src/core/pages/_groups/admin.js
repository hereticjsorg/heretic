const id = "_groups";
const siteConfig = require("#etc/system.js");
const meta = require("./meta.json");

module.exports = {
    id,
    path: "/groups",
    icon: "mdiFormatListChecks",
    collections: {
        main: siteConfig.collections.groups,
    },
    options: {
        itemsPerPage: 20,
        lockTimeout: 60,
    },
    ...meta.admin,
};
