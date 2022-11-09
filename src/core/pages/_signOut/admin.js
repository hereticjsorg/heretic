const meta = require("./meta.json");

const id = "_signOut";

module.exports = {
    id,
    path: "/signOut",
    icon: "mdiLogoutVariant",
    ...meta.admin,
};
