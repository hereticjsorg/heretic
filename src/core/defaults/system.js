const secure = require("./secure.json");

module.exports = {
    id: "heretic",
    secret: secure.secret,
    server: {
        ip: "127.0.0.1",
        port: 3001,
        static: true,
        trustProxy: true,
        ignoreTrailingSlash: true,
    },
    auth: {
        admin: true,
        signIn: true,
        signUp: false,
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
        }
    },
    redis: {
        enabled: false,
        host: "127.0.0.1",
        port: 6379,
    },
    webSockets: {
        enabled: false,
        url: "ws://127.0.0.1:3001/ws",
        options: {
            maxPayload: 1048576,
        }
    },
    token: {
        expiresIn: "7 days",
        ip: false,
    },
    cookieOptions: {
        expires: 604800,
        path: "/",
        domain: "",
        secure: null,
        sameSite: null,
    },
    log: {
        level: "info",
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
        }
    },
    directories: {
        tmp: null,
        files: "files",
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
    },
    routes: {
        admin: "/admin",
        signInAdmin: "/admin/signIn",
        signIn: "/signIn",
        signOutAdmin: "/admin/signOut",
        signOut: "/signOut",
    },
    buildOptions: {
        productionCompress: false,
    },
    test: {
        headless: true,
        executablePath: "auto",
        args: ["--window-size=1920,1080", "--no-sandbox"],
        defaultViewport: null,
        devtools: true,
    },
    heretic: {
        zipball: "http://github.com/xtremespb/heretic/zipball/master/",
    },
};
