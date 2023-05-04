const meta = require("./meta.json");

module.exports = {
    id: "_signUp",
    path: "/signUp",
    langSwitchComponent: false,
    api: {
        signUp: "/api/signUp",
    },
    ...meta.userspace,
};
