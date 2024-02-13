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
            connectTimeoutMS: 5000,
        },
        ...conf.mongo,
    },
    redis: {
        enabled: false,
        host: "127.0.0.1",
        port: 6379,
        connectTimeout: 500,
        maxRetriesPerRequest: 1,
        ...conf.redis,
    },
    email: {
        enabled: false,
        from: "noreply@hereticjs.org",
        admin: "admin@hereticjs.org",
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
    oauth2: [{
            enabled: false,
            name: "oa2google",
            scope: ["profile", "email"],
            credentials: {
                client: {
                    id: "",
                    secret: "",
                },
                auth: process.browser ? null : require("@fastify/oauth2").GOOGLE_CONFIGURATION,
            },
            startRedirectPath: "/oauth2/google",
            callbackUri: "https://demo.hereticjs.org/oauth2/google/callback",
            callbackPath: "/oauth2/google/callback",
            icon: "M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z",
        },
        ...(conf.oauth2 || []),
    ],
    cookieOptions: {
        expires: sessionTTL,
        path: "/",
        domain: "",
        secure: null,
        sameSite: null,
        userCheck: true,
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
            max: 500,
            ban: 1000,
            timeWindow: 10000,
            nameSpace: "heretic-rate-limit-",
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
        captcha: "captcha",
        jobs: "jobs",
        ...conf.collections,
    },
    routes: {
        admin: "/admin",
        signInAdmin: "/admin/signIn",
        signIn: "/signIn",
        signOutAdmin: "/admin/signOut",
        signOut: "/signOut",
        account: "/account",
        signUp: "/signUp",
        restorePassword: "/restorePassword",
        privacyPolicy: "/privacy/site",
        privacyCookies: "/privacy/cookies",
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
        packageJson: "https://raw.githubusercontent.com/hereticjsorg/heretic/master/package.json",
        darkModeEnabled: true,
        restartCommand: "pm2 restart [id]",
        ...conf.heretic,
    },
    ...conf.system,
    sessionTTL,
};
