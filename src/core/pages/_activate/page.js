const meta = require("./meta.json");

module.exports = {
    id: "_activate",
    path: "/activate",
    langSwitchComponent: false,
    api: {
        activate: "/api/user/activate",
    },
    ...meta.userspace,
};
