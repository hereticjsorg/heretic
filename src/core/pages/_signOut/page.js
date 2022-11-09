const meta = require("./meta.json");

module.exports = {
    id: "_signOut",
    path: "/signOut",
    langSwitchComponent: false,
    ...meta.admin,
};
