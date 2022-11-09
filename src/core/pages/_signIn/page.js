const meta = require("./meta.json");

module.exports = {
    id: "_signIn",
    path: "/signIn",
    langSwitchComponent: false,
    ...meta.userspace,
};
