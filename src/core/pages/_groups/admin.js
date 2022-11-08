const id = "_groups";
const siteConfig = require("../../../../etc/system.js");

module.exports = {
    id,
    path: "/groups",
    icon: "mdiFormatListChecks",
    title: {
        "ru-ru": "Группы",
        "en-us": "Groups"
    },
    collections: {
        main: siteConfig.collections.groups,
    },
    options: {
        itemsPerPage: 20,
        lockTimeout: 60,
    },
};
