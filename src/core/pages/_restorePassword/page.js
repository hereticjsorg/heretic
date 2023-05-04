const meta = require("./meta.json");

module.exports = {
    id: "_restorePassword",
    path: "/restorePassword",
    langSwitchComponent: false,
    api: {
        restorePassword: "/api/user/password/restore",
    },
    ...meta.userspace,
};
