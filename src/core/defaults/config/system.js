const u = require(`./_utils.js`);

/*
    This is the main ID which is used to identify the website
    via cookies, system etc. It may represent your website domain
    and should contain small latin characters only
*/
const id = "heretic";

/*
    Session TTL (time-to-live) value, seconds.
    Default: parseInt(parse("7 days") / 1000, 10)) = 604800
*/

const sessionTTL = u.sessionTTL;

/*
    Main configuration object
*/
const config = {
    /*
        Unique secret used to encrypt data, should be kept in a safe
        place. Normally is autogenerated during the initial setup
    */
    secret: u.secure.secret,
    /*
        Hashing method, select either "argon2" or "scrypt"
    */
    hashMethod: "argon2",
    /*
        Server configuration
    */
    server: {
        /*
            IP address where Heretic should listen to.
            Use "0.0.0.0" to listen to all interfaces
        */
        ip: "0.0.0.0",
        /*
            Port where Heretic should listen to
        */
        port: 3001,
        /*
            Set to true if you want to make Heretic serving the static
            assets. Disable it if you are using Nginx or similar proxy
            server
        */
        static: true,
    },
    /*
        Authentication and access options
    */
    auth: {
        /*
            Set to true if you wish to enable the admin panel functionality.
            Mongo is required in order to function
        */
        admin: false,
        /*
            Enable sign in functionality. Mongo is required in order to function
        */
        signIn: false,
        /*
            Enable sign up functionality. Mongo is required in order to function
        */
        signUp: false,
    },
    /*
        MongoDB-related settings
    */
    mongo: {
        /*
            Set to true in order to enable MongoDB
        */
        enabled: false,
        /*
            MongoDB connection URL.
            For a default Docker Compose setup, you may use the following:
            "mongodb://[ID]-mongo:27017" (replace ID by your site ID)
        */
        url: "mongodb://0.0.0.0:27017",
        /*
            Database name
        */
        dbName: "heretic",
        /*
            MongoDB driver options
        */
        options: {
            connectTimeoutMS: 5000,
        },
    },
    /*
        Redis-related settings.
        It's not mandatory to enable Redis, but it's a good option
        which is used by some internal libraries which do implement, for
        example, rate limiting or locking
    */
    redis: {
        /*
            Set to true in order to enable Redis
        */
        enabled: false,
        /*
            Define your Redis connection URL here. In case you're running 
            it on a local machine, you need to set it to "127.0.0.1".
            For a default Docker Compose setup, you may use the following:
            "[ID]-redis" (replace ID by your site ID)
        */
        url: "redis://127.0.0.1:6379",
        /*
            Set to "true" if the Redis Stack Server is available
        */
        stack: false,
        /*
            Redis createClient configuration
        */
        socket: undefined,
        username: undefined,
        password: undefined,
        name: undefined,
        database: undefined,
        modules: undefined,
        readonly: false,
        legacyMode: false,
        pingInterval: undefined,
    },
    /*
        E-mail related configuration
    */
    email: {
        /*
            Are mailing functions enabled for this instance?
        */
        enabled: false,
        /*
            Sender address for all outgoing e-mails
        */
        from: "noreply@hereticjs.org",
        /*
            Webmaster e-mail address
        */
        admin: "admin@hereticjs.org",
        /*
            E-mail service configuration. Nodemailer is used internally,
            so please read more on how to configure here:
            https://nodemailer.com/.

            Example:

            config: {
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: {
                    user: "maddison53@ethereal.email",
                    pass: "password",
                },
            },

        */
        config: {},
    },
    /*
        Websocket transport layer configuration
    */
    webSockets: {
        /*
            Are Websockets enabled?
        */
        enabled: false,
        /*
            Websockets server endpoint
        */
        url: "ws://127.0.0.1:3001/ws",
        /*
            Websockets connection options. The ws module is used
            internally, so you may wish to read more about the possible
            options here: https://www.npmjs.com/package/ws
        */
        options: {
            maxPayload: 1048576,
        },
    },
    /*
        JWT configuration
    */
    token: {
        /*
            Expiration value, seconds.
            Default: 604800
        */
        expiresIn: sessionTTL,
        /*
            Bind tokens to the user IP address
        */
        ip: false,
    },
    /*
        Password policy related settings
    */
    passwordPolicy: {
        /*
            Minimum number of password characters
        */
        minLength: 8,
        /*
            Maximum number of password characters
        */
        maxLength: null,
        /*
            Minimum number of groups required for a valid password.
            Groups are: uppercase characters, lowercase characters,
            numbers, special characters.
            Set to 4 if you need all of them
        */
        minGroups: 2,
        /*
            Need to have uppercase characters in the password
        */
        uppercase: true,
        /*
            Need to have lowercase characters in the password
        */
        lowercase: true,
        /*
            Need to have numbers in the password
        */
        numbers: true,
        /*
            Need to have special characters in the password
        */
        special: true,
    },
    /*
        Oauth2-related settings
    */
    oauth2: [
        /*
            Look for oauth2.js configuration file
        */
        ...u.oauth2,
    ],
    /*
        Cookie-related options
    */
    cookieOptions: {
        /*
            Expiration value, seconds.
            Default: 604800
        */
        expires: sessionTTL,
        /*
            Cookie path
        */
        path: "/",
        /*
            Cookie path domain. Set it to your website's domain
        */
        domain: "",
        /*
            Set true for secure cookies
        */
        secure: null,
        /*
            Set to "strict" in order to prevent cookie hijacking
        */
        sameSite: null,
        /*
            Ask user to accept the cookie policy
        */
        userCheck: true,
    },
    /*
        Log-related options
    */
    log: {
        /*
            Log level value.
            Possible options: "trace", "debug", "info", "warn", "error", or "fatal"
        */
        level: "info",
    },
    /*
        Rate limiting. Please make sure to enable Redis in order to work
    */
    rateLimit: {
        /*
            Enable rate limiting
        */
        enabled: false,
        /*
            Enable bans for repeat offenders
        */
        ban: false,
        /*
            Global rules for all routes
        */
        global: {
            /*
                Maximum number of request until blocked
            */
            max: 500,
            /*
                Maximum number of request until banned
            */
            ban: 1000,
            /*
                Rate limiting TTL, ms
            */
            timeWindow: 10000,
            /*
                Redis namespace.
            */
            nameSpace: `${id}-rate-limit-`,
        },
        /*
            Whitelist of IP addressed which are never get blocked
        */
        whiteList: [],
        /*
            Blacklist of blocked addresses or networks
        */
        blackList: [],
        /*
            List of headers to add
        */
        addHeaders: {
            "x-ratelimit-limit": true,
            "x-ratelimit-remaining": true,
            "x-ratelimit-reset": true,
            "retry-after": true,
        },
    },
    /*
        System directories configuration
    */
    directories: {
        /*
            Directory to store the temporary files. Set to null
            to use operating system TEMP directory
        */
        tmp: null,
        /*
            Directory to store uploaded files
        */
        files: "files",
    },
    /*
        System MongoDB collections
    */
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
        content: "content",
    },
    /*
        System routes
    */
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
    },
    /*
        Heretic build options
    */
    buildOptions: {
        /*
            Compress static files using GZ
        */
        productionCompress: false,
    },
    /*
        Test-related options
    */
    test: {
        /*
            Headless mode for Puppeteer
        */
        headless: true,
        /*
            Define a path to Chromium/Chrome or use "auto" in order
            to find the path automatically
        */
        executablePath: "auto",
        /*
            Puppeteer arguments
        */
        args: ["--window-size=1920,1080", "--no-sandbox"],
        /*
            Default view port
        */
        defaultViewport: null,
        /*
            Open DevTools on start (might be useful when headless = false)
        */
        devtools: true,
    },
    /*
        Internal Heretic settings
    */
    heretic: {
        /*
            Master ZIP path used in the update process
        */
        zipball: "http://github.com/hereticjsorg/heretic/zipball/master/",
        /*
            Path to the main repository package.json file
        */
        packageJson:
            "https://raw.githubusercontent.com/hereticjsorg/heretic/master/package.json",
        /*
            Enable or disable dark mode on the global level
        */
        darkModeEnabled: true,
        /*
            Command to restart Heretic instance, [id] will be replaced by site ID
        */
        restartCommand: `pm2 restart ${id}`,
        /*
            Enable MARKO_DEBUG mode, not recommended
        */
        markoDebug: false,
        /*
            Enable full text search capabilites.
            Required: Redis Stack
        */
        fullTextSearch: false,
    },
    /*
        Do not change values below ;-)
    */
    id,
    sessionTTL,
};

module.exports = u.processConfig(config);
