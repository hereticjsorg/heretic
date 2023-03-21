const meta = require("./meta.json");

const id = "signIn";

module.exports = {
    id,
    path: "/signIn",
    icon: "mdiLoginVariant",
    ...meta.admin,
};
