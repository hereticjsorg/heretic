const meta = require("./meta.json");

const id = "_users";
const siteConfig = require("../../../../etc/system.js");

module.exports = {
    id,
    path: "/users",
    icon: "mdiAccountMultipleOutline",
    collections: {
        main: siteConfig.collections.users,
    },
    options: {
        itemsPerPage: 20,
        lockTimeout: 60,
    },
    ...meta.admin,
};
