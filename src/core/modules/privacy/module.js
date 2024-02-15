const systemConfig = require("#etc/system.js");

const id = "privacy";

module.exports = {
    id,
    routes: {
        userspace: {
            site: {
                path: systemConfig.routes.privacyPolicy || "/privacy/site",
            },
            cookies: {
                path: systemConfig.routes.cookiesPolicy || "/privacy/cookies",
            },
        },
        admin: {},
    },
};
