const meta = require("./meta.json");

module.exports = {
    id: "_status",
    path: "/_status",
    langSwitchComponent: false,
    ...meta.userspace,
};
