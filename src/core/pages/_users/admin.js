const id = "_users";
const siteConfig = require("../../../../etc/system.json");

module.exports = {
    id,
    path: "/users",
    icon: "mdiAccountMultipleOutline",
    title: {
        "ru-ru": "Пользователи",
        "en-us": "Users"
    },
    collections: {
        main: siteConfig.collections.users,
    },
    options: {
        itemsPerPage: 20,
    },
};
