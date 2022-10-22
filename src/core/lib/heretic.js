import Fastify from "fastify";
import Redis from "ioredis";
import path from "path";
import fs from "fs-extra";
import crypto from "crypto";
import {
    MongoClient
} from "mongodb";

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
import routesData from "../../build/routes.json";
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
        // Read configuration files
        try {
            this.config = fs.existsSync(path.resolve(__dirname, "system.json")) ? fs.readJSONSync(path.resolve(__dirname, "system.json")) : fs.readJSONSync(path.resolve(__dirname, "..", "etc", "system.json"));
            this.siteMeta = fs.existsSync(path.resolve(__dirname, "website.json")) ? fs.readJSONSync(path.resolve(__dirname, "website.json")) : fs.readJSONSync(path.resolve(__dirname, "..", "etc", "website.json"));
        } catch {
            // eslint-disable-next-line no-console
            console.error(`Could not read "system.json" and/or "website.json" configuration files.\nRun the following command to create: npm run setup\nRead documentation for more info.`);
            process.exit(1);
        }
        this.config.secretInt = parseInt(crypto.createHash("md5").update(this.config.secret).digest("hex"), 16);
        this.fastify = Fastify({
            logger: new Logger(this.config).getPino(),
            trustProxy: this.config.server.trustProxy,
            ignoreTrailingSlash: this.config.server.ignoreTrailingSlash,
        });
        [this.defaultLanguage] = Object.keys(languages);
        this.utils = new Utils(Object.keys(languages));
        this.fastify.register(require("@fastify/formbody"));
        this.fastify.register(require("@fastify/jwt"), {
            secret: this.config.secret,
        });
        this.fastify.register(require("@fastify/cookie"));
        this.fastify.register(fastifyMultipart);
        this.fastify.register(fastifyURLData);
        this.fastify.decorate("i18nNavigation", {
            userspace: routesData.i18nNavigation.userspace,
            admin: routesData.i18nNavigation.admin,
        });
        this.fastify.decorate("findDatabaseDuplicates", fastifyDecorators.findDatabaseDuplicates);
        this.fastify.decorate("siteMeta", this.siteMeta);
        this.fastify.decorate("siteConfig", this.config);
        this.fastify.decorate("languages", languages);
        this.fastify.decorate("navigation", navigation);
        this.fastify.decorateRequest("validateTableList", requestDecorators.validateTableList);
        this.fastify.decorateRequest("validateDataLoad", requestDecorators.validateDataLoadGeneric);
        this.fastify.decorateRequest("validateDataDelete", requestDecorators.validateDataDeleteGeneric);
        this.fastify.decorateRequest("validateDataBulk", requestDecorators.validateDataBulkGeneric);
        this.fastify.decorateRequest("validateDataExport", requestDecorators.validateDataExportGeneric);
        this.fastify.decorateRequest("validateRecycleBinList", requestDecorators.validateTableRecycleBinList);
        this.fastify.decorateRequest("validateHistoryList", requestDecorators.validateHistoryListGeneric);
        this.fastify.decorateRequest("generateQuery", requestDecorators.generateQuery);
        this.fastify.decorateRequest("bulkUpdateQuery", requestDecorators.bulkUpdateQuery);
        this.fastify.decorateRequest("processFormData", requestDecorators.processFormData);
        this.fastify.decorateRequest("processDataList", requestDecorators.processDataList);
        this.fastify.decorateRequest("findUpdates", requestDecorators.findUpdates);
        this.fastify.decorateReply("success", replyDecorators.success);
        this.fastify.decorateReply("error", replyDecorators.error);
        this.fastify.addHook("preHandler", (request, reply, done) => {
            request.auth = new Auth(this.fastify, request);
            done();
        });
        if (this.config.redis && this.config.redis.enabled) {
            const redis = new Redis(this.config.redis);
            redis.on("error", e => {
                this.fastify.log.error(`Redis ${e}`);
                process.exit(1);
            });
            redis.on("connect", () => this.fastify.log.info(`Connected to Redis Server at ${this.config.redis.host}:${this.config.redis.port}`));
            this.fastify.decorate("redis", redis);
            if (this.config.rateLimit && this.config.rateLimit.enabled) {
                this.fastify.register(hereticRateLimit, this.config.rateLimit);
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
            const output = req.urlData(null, req).path.match(/^\/api\//) ? apiRoute404(rep, this.languageData, language) : await route404(req, rep, this.languageData, language, this.siteMeta, this.config, routesData.i18nNavigation.userspace);
            rep.code(404);
            rep.send(output);
        });
        this.fastify.setErrorHandler(async (err, req, rep) => {
            this.fastify.log.error(err);
            const language = this.utils.getLanguageFromUrl(req.url);
            const output = req.urlData(null, req).path.match(/^\/api\//) ? apiRoute500(err, rep, this.languageData, language) : await route500(err, rep, this.languageData, language, this.siteMeta);
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

    /*
     * Listen to the specified host and port
     */
    listen() {
        this.fastify.listen({
            port: this.config.server.port,
            host: this.config.server.ip
        });
    }

    /*
     * Connect to the MongoDB
     */

    async connectDatabase() {
        // Create MongoDB client and connect
        const mongoClient = new MongoClient(this.config.mongo.url, this.config.mongo.options || {
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
            database: this.config.mongo.dbName
        }).register(async (ff, opts, next) => {
            this.fastify.log.info(`Connected to Mongo Server: (${this.config.mongo.url}/${this.config.mongo.dbName})`);
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
        return this.config;
    }

    /*
     * This method returns site metadata (website.json)
     * @returns {Object} configuration data object (JSON)
     */
    getConfigMeta() {
        return this.meta;
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
        this.fastify.decorate("dataProviders", dataProviders);
    }
}
