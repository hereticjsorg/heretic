const meta = require("./meta.json");

module.exports = {
    id: "account",
    path: "/account",
    langSwitchComponent: false,
    api: {
        getData: "/api/user/getData",
    },
    ...meta.userspace,
};
