const meta = require("./meta.json");

module.exports = {
    id: "signUp",
    path: "/signUp",
    langSwitchComponent: false,
    api: {
        signUp: "/api/signUp",
    },
    ...meta.userspace,
};
