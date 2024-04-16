const {
    parse,
} = require("@lukeed/ms");
const secure = require("./secure.json");
const oauth2 = require("./oauth2.js");

const conf = {
    server: {},
    auth: {},
    mongo: {},
    redis: {},
    email: {},
    webSockets: {},
    token: {},
    oauth2: [],
    passwordPolicy: {},
    cookieOptions: {},
    log: {},
    rateLimit: {},
    directories: {},
    collections: {},
    routes: {},
    buildOptions: {},
    test: {},
    heretic: {},
    system: {},
};

if (!process.browser) {
    for (const k of Object.keys(conf)) {
        try {
            conf[k] = require(`${__dirname}/conf.d/${k}.json`);
        } catch {
            // Ignore
        }
        if (!conf[k] || (Array.isArray(conf[k]) && !conf[k].length)) {
            try {
                conf[k] = require(`${__dirname}/conf.d/${k}.js`);
            } catch {
                // Ignore
            }
        }
    }
}

const sessionTTL = parseInt(parse("7 days") / 1000, 10);

const processConfig = config => {
    for (const k of Object.keys(conf).filter(i => i !== "system")) {
        config[k] = Array.isArray(config[k]) ? [
            ...config[k],
            ...conf[k],
        ] : {
            ...config[k],
            ...conf[k],
        };
    }
    config = {
        ...config,
        ...conf["system"],
    };
    return config
};

module.exports = {
    secure,
    sessionTTL,
    conf,
    oauth2,
    processConfig,
};
