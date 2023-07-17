const id = require("./module.json");

module.exports = {
    id,
    routes: {
        userspace: {
            page: {
                path: `/${id}`,
            },
        },
        admin: {}
    },
};
