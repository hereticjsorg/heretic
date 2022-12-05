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

import hereticRateLimit from "./rateLimit";
import routePageUserspace from "./routes/routePageUserspace";
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
import languages from "../../config/languages.json";
import navigation from "../../config/navigation.json";

/*
 * Main Heretic class used to load configs,
 * initialize Fastify and its plugins
 */
export default class {
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
        this.systemConfig.secretInt = parseInt(crypto.createHash("md5").update(this.systemConfig.secret).digest("hex"), 16);
        this.fastify = Fastify({
            logger: new Logger(this.systemConfig).getPino(),
            trustProxy: this.systemConfig.server.trustProxy,
            ignoreTrailingSlash: this.systemConfig.server.ignoreTrailingSlash,
        });
        [this.defaultLanguage] = Object.keys(languages);
        this.fastify.register(require("@fastify/formbody"));
        this.fastify.register(require("@fastify/jwt"), {
            secret: this.systemConfig.secret,
        });
        this.fastify.register(require("@fastify/cookie"));
        if (this.systemConfig.webSockets || this.systemConfig.webSockets.enabled) {
            this.fastify.register(require("@fastify/websocket"), {
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
        for (const decorateItem of fastifyDecorators.list()) {
            this.fastify.decorate(decorateItem, fastifyDecorators[decorateItem]);
        }
        this.fastify.decorateRequest("fastify", this.fastify);
        for (const decorateItem of requestDecorators.list()) {
            this.fastify.decorateRequest(decorateItem, requestDecorators[decorateItem]);
        }
        for (const decorateItem of replyDecorators.list()) {
            this.fastify.decorateReply(decorateItem, replyDecorators[decorateItem]);
        }
        this.fastify.addHook("preHandler", (request, reply, done) => {
            request.auth = new Auth(this.fastify, request);
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
    }

    /**
     * Load language data using i18n-loader
     */
    async loadLanguageData() {
        this.languageData = {};
        for (const lang of Object.keys(languages)) {
            this.languageData[lang] = await i18nCore.loadLanguageFile(lang);
            for (const page of [...routesData.translatedPages.core, ...routesData.translatedPages.user, ...routesData.translatedPages.module]) {
                const i18nLoader = await import(`../../build/loaders/i18n-loader-${page}.js`);
                this.languageData[lang] = {
                    ...this.languageData[lang],
                    ...await i18nLoader.loadLanguageFile(lang),
                };
            }
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
     * Register error routes (both 404 and 500)
     */
    registerRouteErrors() {
        this.fastify.setNotFoundHandler(async (req, rep) => {
            const language = this.utils.getLanguageFromUrl(req.url);
            const output = req.urlData(null, req).path.match(/^\/api\//) ? apiRoute404(rep, this.languageData, language) : await route404(req, rep, this.languageData, language, this.siteConfig, this.systemConfig, routesData.i18nNavigation.userspace);
            rep.code(404);
            rep.send(output);
        });
        this.fastify.setErrorHandler(async (err, req, rep) => {
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
            const api = await import(`../../pages/${page}/api/index.js`);
            api.default(this.fastify);
        }
        for (const page of routesData.api.core) {
            const api = await import(`../pages/${page}/api/index.js`);
            api.default(this.fastify);
        }
        for (const module of routesData.api.modules) {
            const api = await import(`../../modules/${module}/api/index.js`);
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
            const Ws = (await import(`../../pages/${page}/ws/index.js`)).default;
            this.wsHandlers.push(new Ws(this.fastify));
        }
        for (const page of routesData.ws.core) {
            const Ws = (await import(`../pages/${page}/ws/index.js`)).default;
            this.wsHandlers.push(new Ws(this.fastify));
        }
        for (const module of routesData.ws.modules) {
            const Ws = (await import(`../../modules/${module}/ws/index.js`)).default;
            this.wsHandlers.push(new Ws(this.fastify));
        }
        this.fastify.register(async fastify => {
            fastify.get("/ws", {
                websocket: true,
            }, async (connection, req) => {
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
                connection.socket.on("message", message => {
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
        const mongoClient = new MongoClient(this.systemConfig.mongo.url, this.systemConfig.mongo.options || {
            useUnifiedTopology: true,
            connectTimeoutMS: 5000,
            keepAlive: true,
            useNewUrlParser: true
        });
        mongoClient.on("serverDescriptionChanged", e => {
            if (e && e.newDescription && e.newDescription.error) {
                this.fastify.log.error("Fatal: connection to MongoDB is broken");
                process.exit(1);
            }
        });
        await mongoClient.connect();
        // Register MongoDB for Fastify
        this.fastify.register(require("@fastify/mongodb"), {
            client: mongoClient,
            database: this.systemConfig.mongo.dbName
        }).register(async (ff, opts, next) => {
            this.fastify.log.info(`Connected to Mongo Server: (${this.systemConfig.mongo.url}/${this.systemConfig.mongo.dbName})`);
            next();
        });
    }

    disconnectDatabase() {
        if (this.fastify.mongo && this.fastify.mongo.db) {
            this.fastify.mongo.db.close();
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
                dataProviders[page] = provider;
            } catch {
                // Ignore
            }
        }
        for (const module of routesData.directories.modules) {
            try {
                const Provider = (await import(`../../modules/${module}/data/provider`)).default;
                const provider = new Provider();
                dataProviders[module] = provider;
            } catch {
                // Ignore
            }
        }
        for (const page of routesData.directories.pages) {
            try {
                const Provider = (await import(`../../pages/${page}/data/provider`)).default;
                const provider = new Provider();
                dataProviders[page] = provider;
            } catch {
                // Ignore
            }
        }
        this.fastify.decorate("dataProviders", dataProviders);
    }
}
