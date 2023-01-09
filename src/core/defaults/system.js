const secure = require("./secure.json");

const conf = {
    server: {},
    auth: {},
    mongo: {},
    redis: {},
    webSockets: {},
    token: {},
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
    }
}

module.exports = {
    id: "heretic",
    secret: secure.secret,
    server: {
        ip: "127.0.0.1",
        port: 3001,
        static: true,
        trustProxy: true,
        ignoreTrailingSlash: true,
        ...conf.server,
    },
    auth: {
        admin: true,
        signIn: true,
        signUp: false,
        ...conf.auth,
    },
    mongo: {
        enabled: true,
        url: "mongodb://127.0.0.1:27017",
        dbName: "heretic",
        options: {
            useUnifiedTopology: true,
            connectTimeoutMS: 5000,
            keepAlive: true,
            useNewUrlParser: true,
        },
        ...conf.mongo,
    },
    redis: {
        enabled: false,
        host: "127.0.0.1",
        port: 6379,
        ...conf.redis,
    },
    webSockets: {
        enabled: false,
        url: "ws://127.0.0.1:3001/ws",
        options: {
            maxPayload: 1048576,
        },
        ...conf.webSockets,
    },
    token: {
        expiresIn: "7 days",
        ip: false,
        ...conf.token,
    },
    cookieOptions: {
        expires: 604800,
        path: "/",
        domain: "",
        secure: null,
        sameSite: null,
        ...conf.cookieOptions,
    },
    log: {
        level: "info",
        ...conf.log,
    },
    rateLimit: {
        enabled: false,
        ban: false,
        global: {
            max: 100,
            ban: 1000,
            timeWindow: 10000
        },
        whiteList: [],
        blackList: [],
        addHeaders: {
            "x-ratelimit-limit": true,
            "x-ratelimit-remaining": true,
            "x-ratelimit-reset": true,
            "retry-after": true,
        },
        ...conf.rateLimit,
    },
    directories: {
        tmp: null,
        files: "files",
        ...conf.directories,
    },
    collections: {
        users: "users",
        files: "files",
        counters: "counters",
        history: "history",
        groups: "groups",
        events: "events",
        geoNetworks: "geoNetworks",
        geoCountries: "geoCountries",
        geoCities: "geoCities",
        version: "version",
        ...conf.collections,
    },
    routes: {
        admin: "/admin",
        signInAdmin: "/admin/signIn",
        signIn: "/signIn",
        signOutAdmin: "/admin/signOut",
        signOut: "/signOut",
        ...conf.routes,
    },
    buildOptions: {
        productionCompress: false,
        ...conf.buildOptions,
    },
    test: {
        headless: true,
        executablePath: "auto",
        args: ["--window-size=1920,1080", "--no-sandbox"],
        defaultViewport: null,
        devtools: true,
        ...conf.test,
    },
    heretic: {
        zipball: "http://github.com/xtremespb/heretic/zipball/master/",
        ...conf.heretic,
    },
    ...conf.system,
};
