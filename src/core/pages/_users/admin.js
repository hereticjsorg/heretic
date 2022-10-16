const id = "_users";

module.exports = {
    id,
    path: "/users",
    icon: "mdiAccountMultipleOutline",
    title: {
        "ru-ru": "Пользователи",
        "en-us": "Users"
    },
    collections: {
        main: id,
    },
    options: {
        itemsPerPage: 20,
    },
};
