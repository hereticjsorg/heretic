const {
    parse,
} = require("@lukeed/ms");
const secure = require("./secure.json");

const conf = {
    server: {},
    auth: {},
    mongo: {},
    redis: {},
    email: {},
    webSockets: {},
    token: {},
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
    }
}

const sessionTTL = parseInt(parse("7 days") / 1000, 10);

module.exports = {
    id: "heretic",
    secret: secure.secret,
    hashMethod: "argon2",
    server: {
        ip: "0.0.0.0",
        port: 3001,
        static: true,
        trustProxy: true,
        ignoreTrailingSlash: true,
        ...conf.server,
    },
    auth: {
        admin: false,
        signIn: false,
        signUp: false,
        ...conf.auth,
    },
    mongo: {
        enabled: false,
        url: "mongodb://0.0.0.0:27017",
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
    email: {
        enabled: false,
        from: "noreply@hereticjs.org",
        config: {},
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
        expiresIn: sessionTTL,
        ip: false,
        ...conf.token,
    },
    passwordPolicy: {
        minLength: 8,
        maxLength: null,
        minGroups: 2,
        uppercase: true,
        lowercase: true,
        numbers: true,
        special: true,
    },
    cookieOptions: {
        expires: sessionTTL,
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
        sessions: "sessions",
        activation: "activation",
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
        zipball: "http://github.com/hereticjsorg/heretic/zipball/master/",
        ...conf.heretic,
    },
    darkModeEnabled: true,
    ...conf.system,
    sessionTTL,
};
