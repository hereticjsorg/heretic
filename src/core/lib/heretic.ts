import Fastify from "fastify";
import Redis from "ioredis";
import path from "path";
import crypto from "crypto";
import {
    MongoClient
} from "mongodb";
import {
    v4 as uuid,
} from "uuid";
import oauthPlugin from "@fastify/oauth2";
import commandLineArgs from "command-line-args";

import template from "lodash.template";
import hereticRateLimit from "./rateLimit";
import routePageUserspace from "./routes/routePageUserspace.js";
import routeModuleUserspace from "./routes/routeModuleUserspace";
import routePageAdmin from "./routes/routePageAdmin";
import routeModuleAdmin from "./routes/routeModuleAdmin";
import routePageCore from "./routes/routePageCore";
import route404 from "./routes/route404";
import route500 from "./routes/route500";
import apiRoute404 from "./routes/route404-api";
import apiRoute500 from "./routes/route500-api";
import routesData from "../../build/build.json";
import Logger from "./logger";
import Utils from "./utils";
import Auth from "./auth";
import fastifyDecorators from "./fastifyDecorators";
import replyDecorators from "./replyDecorators";
import requestDecorators from "./requestDecorators";
import fastifyURLData from "./urlData";
import fastifyMultipart from "./multipart";
import i18nCore from "../../build/loaders/i18n-loader-core.js";
import languages from "../../../etc/languages.json";
import navigation from "../../../etc/navigation.json";
import packageJson from "../../../package.json";

/*
 * Main Heretic class used to load configs,
 * initialize Fastify and its plugins
 */
export default class {
    utils: Utils;

    systemConfig: any;

    siteConfig: any;

    fastify: any;

    defaultLanguage: any;

    wsHandlers: any[];

    options: commandLineArgs.CommandLineOptions;

    languageData: any;

    languages: string[];

    constructor() {
        this.utils = new Utils(Object.keys(languages));
        // Read configuration files
        try {
            // eslint-disable-next-line no-undef
            this.systemConfig = __non_webpack_require__(path.resolve(__dirname, "..", "etc", "system.js"));
            // eslint-disable-next-line no-undef
            this.siteConfig = __non_webpack_require__(path.resolve(__dirname, "..", "etc", "website.js"));
        } catch {
            // eslint-disable-next-line no-console
            console.error(`Could not read "system.js" and/or "website.js" configuration files.\nRun the following command to create: npm run configure\nRead documentation for more info.`);
            process.exit(1);
        }
        this.systemConfig.versionHash = crypto.createHmac("sha256", this.systemConfig.secret).update(packageJson.version).digest("hex");
        this.systemConfig.secretInt = parseInt(crypto.createHash("md5").update(this.systemConfig.secret).digest("hex"), 16);
        this.systemConfig.passwordPolicy = this.systemConfig.passwordPolicy || {
            minLength: 8,
            maxLength: null,
            minGroups: 2,
            uppercase: true,
            lowercase: true,
            numbers: true,
            special: true,
        };
        this.fastify = Fastify({
            logger: new Logger(this.systemConfig).getPino(),
            trustProxy: this.systemConfig.server.trustProxy,
            ignoreTrailingSlash: this.systemConfig.server.ignoreTrailingSlash,
        });
        [this.defaultLanguage] = Object.keys(languages);
        this.languages = Object.keys(languages);
        this.fastify.register(require("@fastify/formbody"));
        this.fastify.register(require("@fastify/jwt"), {
            secret: this.systemConfig.secret,
        });
        this.fastify.register(require("@fastify/cookie"));
        if (this.systemConfig.webSockets || this.systemConfig.webSockets.enabled) {
            this.fastify.register(require("./websocket.js"), {
                options: this.systemConfig.webSockets.options,
            });
        }
        this.wsHandlers = [];
        this.fastify.register(fastifyMultipart);
        this.fastify.register(fastifyURLData);
        this.fastify.decorate("i18nNavigation", {
            userspace: routesData.i18nNavigation.userspace,
            admin: routesData.i18nNavigation.admin,
        });
        this.fastify.decorate("siteConfig", this.siteConfig);
        this.fastify.decorate("systemConfig", this.systemConfig);
        this.fastify.decorate("languages", languages);
        this.fastify.decorate("navigation", navigation);
        const fastifyDecoratorsList = fastifyDecorators.list();
        for (const decorateItem of fastifyDecoratorsList) {
            this.fastify.decorate(decorateItem, fastifyDecorators[decorateItem as keyof typeof fastifyDecorators]);
        }
        const requestDecoratorsList = requestDecorators.list();
        for (const decorateItem of requestDecoratorsList) {
            this.fastify.decorateRequest(decorateItem, requestDecorators[decorateItem as keyof typeof requestDecorators]);
        }
        const replyDecoratorsList = replyDecorators.list();
        for (const decorateItem of replyDecoratorsList) {
            this.fastify.decorateReply(decorateItem, replyDecorators[decorateItem as keyof typeof replyDecorators]);
        }
        this.fastify.addHook("preHandler", (request: { auth: Auth; fastify: any; }, reply: any, done: () => void) => {
            request.auth = new Auth(this.fastify, request);
            request.fastify = this.fastify;
            done();
        });
        if (this.systemConfig.redis && this.systemConfig.redis.enabled) {
            const redis = new Redis(this.systemConfig.redis);
            redis.on("error", e => {
                this.fastify.log.error(`Redis ${e}`);
                process.exit(1);
            });
            redis.on("connect", () => this.fastify.log.info(`Connected to Redis Server at ${this.systemConfig.redis.host}:${this.systemConfig.redis.port}`));
            this.fastify.decorate("redis", redis);
            if (this.systemConfig.rateLimit && this.systemConfig.rateLimit.enabled) {
                this.fastify.register(hereticRateLimit, this.systemConfig.rateLimit);
            }
        }
        try {
            this.options = commandLineArgs([{
                name: "command",
                defaultOption: true,
            }, {
                name: "setup",
                type: Boolean,
            }], {
                stopAtFirstUnknown: true,
            });
        } catch (e) {
            this.fastify.log.error(e.message);
            process.exit(1);
        }
    }

    /**
     * Get options object
     */
    getOptions() {
        return this.options;
    }

    /**
     * Load language data using i18n-loader
     */
    async loadLanguageData() {
        this.languageData = {};
        const languagesList = Object.keys(languages);
        for (const lang of languagesList) {
            (this.languageData as Record<string, object>)[lang] = await i18nCore.loadLanguageFile(lang);
            for (const page of [...routesData.translatedPages.core, ...routesData.translatedPages.user, ...routesData.translatedPages.module]) {
                const i18nLoader = await import(`../../build/loaders/i18n-loader-${page}.js`);
                (this.languageData as Record<string, object>)[lang] = {
                    ...(this.languageData as Record<string, object>)[lang],
                    ...await i18nLoader.loadLanguageFile(lang),
                };
            }
            Object.keys(this.languageData[lang]).map((i: any) => this.languageData[lang][i] = template(this.languageData[lang][i]));
        }
        this.fastify.decorate("languageData", this.languageData);
    }

    /*
     * Register fastify-static plugin to serve static
     * assets (useful in development mode)
     */
    serveStaticContent() {
        this.fastify.register(require("@fastify/static"), {
            root: path.resolve(__dirname, "public"),
            prefix: "/"
        });
    }

    /*
     * Register routes for all pages
     */
    registerRoutePagesUserspace() {
        for (const route of routesData.routes.userspace) {
            if (route.module) {
                this.fastify.get(route.path || "/", routeModuleUserspace(route, this.languageData, this.defaultLanguage));
                for (const lang of Object.keys(languages)) {
                    if (lang !== this.defaultLanguage) {
                        this.fastify.get(`/${lang}${route.path}`, routeModuleUserspace(route, this.languageData, lang));
                    }
                }
            } else {
                this.fastify.get(route.path || "/", routePageUserspace(route, this.languageData, this.defaultLanguage));
                for (const lang of Object.keys(languages)) {
                    if (lang !== this.defaultLanguage) {
                        this.fastify.get(`/${lang}${route.path}`, routePageUserspace(route, this.languageData, lang));
                    }
                }
            }
        }
    }

    /*
     * Register admin routes for all pages
     */
    registerRoutePagesAdmin() {
        if (!this.systemConfig.auth.admin) {
            return;
        }
        for (const route of routesData.routes.admin) {
            if (route.module) {
                this.fastify.get(route.path, routeModuleAdmin(route, this.languageData, this.defaultLanguage));
                for (const lang of Object.keys(languages)) {
                    if (lang !== this.defaultLanguage) {
                        this.fastify.get(`/${lang}${route.path}`, routeModuleAdmin(route, this.languageData, lang));
                    }
                }
            } else {
                this.fastify.get(route.path, routePageAdmin(route, this.languageData, this.defaultLanguage));
                for (const lang of Object.keys(languages)) {
                    if (lang !== this.defaultLanguage) {
                        this.fastify.get(`/${lang}${route.path}`, routePageAdmin(route, this.languageData, lang));
                    }
                }
            }
        }
    }

    /*
     * Register core routes for all pages
     */
    registerRoutePagesCore() {
        for (const route of routesData.routes.core) {
            this.fastify.get(route.path, routePageCore(route, this.languageData, this.defaultLanguage));
            for (const lang of Object.keys(languages)) {
                if (lang !== this.defaultLanguage) {
                    this.fastify.get(`/${lang}${route.path}`, routePageCore(route, this.languageData, lang));
                }
            }
        }
    }

    /*
     * Register core routes for all pages
     */
    async registerOauth2() {
        if (!this.systemConfig.oauth2 || !Array.isArray(this.systemConfig.oauth2)) {
            return;
        }
        for (const route of this.systemConfig.oauth2) {
            if (!route.enabled) {
                continue;
            }
            try {
                this.fastify.register(oauthPlugin, route);
                const oa2 = (await import(`../oauth2/${route.name.replace(/^oa2/, "")}.js`)).default;
                this.fastify.get(route.callbackPath, oa2());
            } catch {
                // Ignore
            }
        }
    }

    /*
     * Register error routes (both 404 and 500)
     */
    registerRouteErrors() {
        this.fastify.setNotFoundHandler(async (req: { url: any; urlData: (arg0: null, arg1: any) => { (): any; new(): any; path: string; }; }, rep: { code: (arg0: number) => void; send: (arg0: string | { error: number; errorMessage: any; }) => void; }) => {
            const language = this.utils.getLanguageFromUrl(req.url);
            const output = req.urlData(null, req).path.match(/^\/api\//) ? apiRoute404(rep, this.languageData, language) : await route404(req, rep, this.languageData, language, this.siteConfig, this.systemConfig, routesData.i18nNavigation.userspace);
            rep.code(404);
            rep.send(output);
        });
        this.fastify.setErrorHandler(async (err: { code: number; }, req: { url: any; urlData: (arg0: null, arg1: any) => { (): any; new(): any; path: string; }; }, rep: { code: (arg0: number) => void; send: (arg0: string | { error: number; errorMessage: any; }) => void; }) => {
            this.fastify.log.error(err);
            const language = this.utils.getLanguageFromUrl(req.url);
            const output = req.urlData(null, req).path.match(/^\/api\//) ? apiRoute500(err, rep, this.languageData, language) : await route500(err, rep, this.languageData, language, this.siteConfig);
            rep.code(err.code === 429 ? 429 : 500);
            rep.send(output);
        });
    }

    /**
     * Register API routes
     */
    async registerRouteAPI() {
        for (const page of routesData.api.root) {
            const api = await import(`../api/${page}/index.js`);
            api.default(this.fastify);
        }
        for (const page of routesData.api.userspace) {
            const api = await import(`../../../site/pages/${page}/api/index.js`);
            api.default(this.fastify);
        }
        for (const page of routesData.api.core) {
            const api = await import(`../pages/${page}/api/index.js`);
            api.default(this.fastify);
        }
        for (const module of routesData.api.modules) {
            const api = await import(`../../../site/modules/${module}/api/index.js`);
            api.default(this.fastify);
        }
    }

    /**
     * Register WebSocket routes
     */
    async registerRouteWebSockets() {
        if (!this.systemConfig.webSockets || !this.systemConfig.webSockets.enabled) {
            return;
        }
        for (const file of routesData.ws.root) {
            const Ws = (await import(`../ws/${file}`)).default;
            this.wsHandlers.push(new Ws(this.fastify));
        }
        for (const page of routesData.ws.userspace) {
            const Ws = (await import(`../../../site/pages/${page}/ws/index.js`)).default;
            this.wsHandlers.push(new Ws(this.fastify));
        }
        for (const page of routesData.ws.core) {
            const Ws = (await import(`../pages/${page}/ws/index.js`)).default;
            this.wsHandlers.push(new Ws(this.fastify));
        }
        for (const module of routesData.ws.modules) {
            const Ws = (await import(`../../../site/modules/${module}/ws/index.js`)).default;
            this.wsHandlers.push(new Ws(this.fastify));
        }
        this.fastify.register(async (fastify: { get: (arg0: string, arg1: { websocket: boolean; }, arg2: (connection: any, req: any) => Promise<void>) => void; redis: { set: (arg0: string, arg1: number, arg2: string, arg3: number) => any; del: (arg0: string) => any; }; siteConfig: { id: any; }; }) => {
            fastify.get("/ws", {
                websocket: true,
            }, async (connection: { socket: { send: (arg0: string) => void; close: () => void; on: any; }; uid: string; }, req: { auth: { getData: (arg0: any) => any; methods: { COOKIE: any; }; }; }) => {
                const authData = await req.auth.getData(req.auth.methods.COOKIE);
                for (const handler of this.wsHandlers) {
                    if (!authData) {
                        try {
                            connection.socket.send(JSON.stringify({
                                error: true,
                                code: 403,
                                message: "accessDenied",
                            }));
                        } catch {
                            // Ignore
                        }
                        try {
                            connection.socket.close();
                        } catch {
                            // Ignore
                        }
                        return;
                    }
                    handler.onConnect(connection, req);
                }
                connection.uid = uuid();
                if (fastify.redis) {
                    try {
                        await fastify.redis.set(`${fastify.siteConfig.id}_user_${authData._id.toString()}_${connection.uid.replace(/-/gm, "_")}`, Math.floor(Date.now() / 1000), "ex", 120);
                    } catch {
                        // Ignore
                    }
                }
                connection.socket.on("message", async (message: any) => {
                    for (const handler of this.wsHandlers) {
                        handler.onMessage(connection, req, message);
                    }
                });
                connection.socket.on("close", async () => {
                    if (fastify.redis) {
                        try {
                            await fastify.redis.del(`${fastify.siteConfig.id}_user_${authData._id.toString()}_${connection.uid.replace(/-/gm, "_")}`);
                        } catch {
                            // Ignore
                        }
                    }
                    for (const handler of this.wsHandlers) {
                        handler.onDisconnect(connection, req);
                    }
                });
            });
        });
    }

    /*
     * Listen to the specified host and port
     */
    listen() {
        this.fastify.listen({
            port: this.systemConfig.server.port,
            host: this.systemConfig.server.ip
        });
    }

    /*
     * Connect to the MongoDB
     */

    async connectDatabase() {
        // Create MongoDB client and connect
        if (this.systemConfig.mongo.enabled) {
            const mongoClient = new MongoClient(this.systemConfig.mongo.url, this.systemConfig.mongo.options || {
                useUnifiedTopology: true,
                connectTimeoutMS: 5000,
                useNewUrlParser: true
            });
            mongoClient.on("serverDescriptionChanged", e => {
                if (e && e.newDescription && e.newDescription.error) {
                    this.fastify.log.error("Fatal: connection to MongoDB is broken");
                    process.exit(1);
                }
            });
            await mongoClient.connect();
            this.fastify.decorate("mongoClient", mongoClient);
            this.fastify.log.info(`Connected to Mongo Server: (${this.systemConfig.mongo.url}/${this.systemConfig.mongo.dbName})`);
            // Register MongoDB for Fastify
            this.fastify.register(require("@fastify/mongodb"), {
                client: mongoClient,
                database: this.systemConfig.mongo.dbName,
            }).register(async (ff: any, opts: any, next: () => void) => {
                next();
            });
        }
    }

    disconnectDatabase() {
        if (this.systemConfig.mongo.enabled) {
            try {
                this.fastify.mongoClient.close();
                this.fastify.log.info("Disconnected from database");
            } catch (e) {
                this.fastify.log.error(e.message);
            }
        }
    }

    /*
     * This method returns current Fastify instance
     * @returns {Object} fastify object
     */
    getFastifyInstance() {
        return this.fastify;
    }

    /*
     * This method returns system configuration data (system.json)
     * @returns {Object} configuration data object (JSON)
     */
    getConfigSystem() {
        return this.systemConfig;
    }

    /*
     * This method returns site config (website.js)
     * @returns {Object} configuration data object (JSON)
     */
    getConfigWebsite() {
        return this.siteConfig;
    }

    /*
     * This method loads data providers
     * @returns {Array} data provider objects
     */
    async initDataProviders() {
        const dataProviders = {};
        for (const page of routesData.directories.pagesCore) {
            try {
                const Provider = (await import(`../pages/${page}/data/provider`)).default;
                const provider = new Provider();
                (dataProviders as Record<typeof page, typeof provider>)[page] = provider;
            } catch {
                // Ignore
            }
        }
        for (const module of routesData.directories.modules) {
            try {
                const Provider = (await import(`../../../site/modules/${module}/data/provider`)).default;
                const provider = new Provider();
                (dataProviders as Record<typeof module, typeof provider>)[module] = provider;
            } catch {
                // Ignore
            }
        }
        for (const page of routesData.directories.pages) {
            try {
                const Provider = (await import(`../../../site/pages/${page}/data/provider`)).default;
                const provider = new Provider();
                (dataProviders as Record<typeof page, typeof provider>)[page] = provider;
            } catch {
                // Ignore
            }
        }
        this.fastify.decorate("dataProviders", dataProviders);
    }

    async createIndex(id: any, collection: any, fields: any[], direction = "asc") {
        const db = this.fastify.mongoClient.db(this.fastify.systemConfig.mongo.dbName);
        const indexCreate = {};
        fields.map((i: string | number) => {
            (indexCreate as Record<string | number, number>)[i] = direction === "asc" ? 1 : -1;
        });
        this.fastify.log.info(`Dropping index: ${collection}_${direction}...`);
        try {
            await db.collection(collection).dropIndex(`${collection}_${direction}`);
        } catch {
            // Ignore
        }
        this.fastify.log.info(`Creating index: ${collection}_${direction}...`);
        try {
            await db.collection(collection).createIndex(indexCreate, {
                name: `${collection}_${direction}`,
            });
        } catch {
            // Ignore
        }
    }

    async createExpireIndex(id: any, collection: any, field: string | number, seconds: string) {
        const db = this.fastify.mongoClient.db(this.fastify.systemConfig.mongo.dbName);
        const indexExpire = {};
        (indexExpire as Record<typeof field, number>)[field] = 1;
        this.fastify.log.info(`Dropping index: ${collection}_expire...`);
        try {
            await db.collection(collection).dropIndex(`${collection}_expire}`);
        } catch {
            // Ignore
        }
        this.fastify.log.info(`Creating index: ${collection}_expire...`);
        try {
            await db.collection(collection).createIndex(indexExpire, {
                expireAfterSeconds: parseInt(seconds, 10),
                name: `${collection}_expire`
            });
        } catch {
            // Ignore
        }
    }

    async updateSetupVersion(_id: string) {
        const db = this.fastify.mongoClient.db(this.fastify.systemConfig.mongo.dbName);
        await db.collection(this.fastify.systemConfig.collections.version).findOneAndUpdate({
            _id,
        }, {
            $set: {
                value: packageJson.version,
            },
        }, {
            upsert: true,
        });
    }

    async setup(installedVersions: { [x: string]: any; core?: any; }, options: commandLineArgs.CommandLineOptions) {
        if (!installedVersions.core || options.setup) {
            for (const file of routesData.coreSetupFiles) {
                let Setup;
                try {
                    Setup = (await import(`../setup/${file}`)).default;
                } catch {
                    // Ignore
                }
                if (Setup) {
                    this.fastify.log.info(`Executing installation script: ${file}...`);
                    const setup = new Setup(file, this.fastify, {
                        createIndex: this.createIndex.bind(this),
                        createExpireIndex: this.createExpireIndex.bind(this),
                    }, installedVersions);
                    await setup.process();
                    await this.updateSetupVersion("core");
                } else {
                    this.fastify.log.info(`Could not load installation script: ${file}`);
                }
            }
        }
        for (const page of routesData.directories.pages) {
            if (!installedVersions[page] || options.setup) {
                let Setup;
                try {
                    Setup = (await import(`../../../site/pages/${page}/setup.js`)).default;
                } catch {
                    // Ignore
                }
                if (Setup) {
                    this.fastify.log.info(`Executing installation script for page: ${page}...`);
                    const setup = new Setup(page, this.fastify, {
                        createIndex: this.createIndex.bind(this),
                        createExpireIndex: this.createExpireIndex.bind(this),
                    }, installedVersions);
                    await setup.process();
                    await this.updateSetupVersion(page);
                }
            }
        }
        for (const page of routesData.directories.pagesCore) {
            if (!installedVersions[page] || options.setup) {
                let Setup;
                try {
                    Setup = (await import(`../pages/${page}/setup.js`)).default;
                } catch {
                    // Ignore
                }
                if (Setup) {
                    this.fastify.log.info(`Executing installation script for core page: ${page}...`);
                    const setup = new Setup(page, this.fastify, {
                        createIndex: this.createIndex.bind(this),
                        createExpireIndex: this.createExpireIndex.bind(this),
                    }, installedVersions);
                    await setup.process();
                    await this.updateSetupVersion(page);
                }
            }
        }
        for (const module of routesData.directories.modules) {
            if (!installedVersions[module] || options.setup) {
                let Setup;
                try {
                    Setup = (await import(`../../../site/modules/${module}/setup.js`)).default;
                } catch {
                    // Ignore
                }
                if (Setup) {
                    this.fastify.log.info(`Executing installation script for module: ${module}...`);
                    const setup = new Setup(module, this.fastify, {
                        createIndex: this.createIndex.bind(this),
                        createExpireIndex: this.createExpireIndex.bind(this),
                    }, installedVersions);
                    await setup.process();
                    await this.updateSetupVersion(module);
                }
            }
        }
    }

    async installedDbVersions() {
        const db = this.fastify.mongoClient.db(this.fastify.systemConfig.mongo.dbName);
        try {
            const versionData = {};
            const versionDataDb = (await db.collection(this.fastify.systemConfig.collections.version).find({}).toArray()) || [];
            for (const item of versionDataDb) {
                (versionData as Record<typeof item._id, typeof item._id>)[item._id] = item.value;
            }
            return versionData;
        } catch {
            return {};
        }
    }
}
