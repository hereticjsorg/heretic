const meta = require("./meta.json");

module.exports = {
    id: "signIn",
    path: "/signIn",
    langSwitchComponent: false,
    ...meta.userspace,
};
