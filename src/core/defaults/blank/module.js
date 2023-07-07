const path = require("path");

const {
    id,
} = require(path.resolve(__dirname, "module.json"));

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
