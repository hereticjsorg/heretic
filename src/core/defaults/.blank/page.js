const meta = require("./meta.json");

module.exports = {
    id: "blank",
    path: "/blank",
    langSwitchComponent: true,
    ...meta.userspace,
};
