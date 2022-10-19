const id = "_groups";
const siteConfig = require("../../../../etc/system.json");

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
    },
};
