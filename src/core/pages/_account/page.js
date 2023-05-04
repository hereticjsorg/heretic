const meta = require("./meta.json");

module.exports = {
    id: "_account",
    path: "/account",
    langSwitchComponent: false,
    api: {
        getData: "/api/user/getData",
    },
    ...meta.userspace,
};
