const meta = require("./meta.json");

const id = "_signIn";

module.exports = {
    id,
    path: "/signIn",
    icon: "mdiLoginVariant",
    ...meta.admin,
};
