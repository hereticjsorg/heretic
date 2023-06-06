const meta = require("./meta.json");

module.exports = {
    id: "restorePassword",
    path: "/restorePassword",
    langSwitchComponent: false,
    api: {
        restorePassword: "/api/user/password/restore",
    },
    ...meta.userspace,
};
