const meta = require("./meta.json");

module.exports = {
    id: meta.id,
    path: `/${meta.id}`,
    langSwitchComponent: true,
    ...meta.userspace,
};
