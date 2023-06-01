const id = "_events";
const siteConfig = require("#etc/system.js");
const meta = require("./meta.json");

module.exports = {
    id,
    path: "/events",
    icon: "mdiCalendarAlert",
    collections: {
        main: siteConfig.collections.events,
    },
    options: {
        itemsPerPage: 20,
        lockTimeout: 60,
    },
    ...meta.admin,
};
