const meta = require("./meta.json");

module.exports = {
    id: "_signUp",
    path: "/signUp",
    langSwitchComponent: false,
    api: {
        activate: "/api/user/activate",
    },
    ...meta.userspace,
};
