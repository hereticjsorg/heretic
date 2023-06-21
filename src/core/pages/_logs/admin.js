const id = "_logs";
const meta = require("./meta.json");

module.exports = {
    id,
    path: "/logs",
    icon: "mdiPostOutline",
    options: {
        itemsPerPage: 20,
    },
    ...meta.admin,
};
