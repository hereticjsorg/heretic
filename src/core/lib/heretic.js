import Fastify from "fastify";
import path from "path";
import crypto from "crypto";
import { MongoClient } from "mongodb";
import { createClient, SchemaFieldTypes } from "redis";
import { v4 as uuid } from "uuid";
import oauthPlugin from "@fastify/oauth2";
import commandLineArgs from "command-line-args";

import template from "lodash/template";
import routePageUserspace from "./routes/routePageUserspace.js";
import routePageContent from "./routes/routePageContent.js";
import route404 from "./routes/route404.js";
import route500 from "./routes/route500.js";
import apiRoute404 from "./routes/route404-api.js";
import apiRoute500 from "./routes/route500-api.js";
import buildData from "#build/build.json";
import Logger from "./logger.js";
import Utils from "./utils.js";
import Auth from "./auth.js";
import fastifyDecorators from "./fastifyDecorators.js";
import replyDecorators from "./replyDecorators.js";
import requestDecorators from "./requestDecorators.js";
import fastifyURLData from "./urlData.js";
import fastifyMultipart from "./multipart.js";
import i18nCore from "#build/loaders/i18n-loader-core.js";
import languages from "#etc/languages.json";
import packageJson from "#root/package.json";
import routePageAdmin from "./routes/routePageAdmin.js";
import DynamicLoader from "#build/dynamicLoader.js";
import ConfigLoader from "#lib/configLoader.js";

delete packageJson.dependencies;
delete packageJson.devDependencies;
delete packageJson.imports;
delete packageJson.scripts;
delete packageJson.description;
delete packageJson.keywords;
delete packageJson.author;
delete packageJson.license;
delete packageJson.main;
delete packageJson.name;

/*
 * Main Heretic class used to load configs,
 * initialize Fastify and its plugins
 */
export default class {
    async initRedis() {
        if (this.systemConfig.redis && this.systemConfig.redis.enabled) {
            const clientUrl =
                this.systemConfig.redis.url ||
                `redis://${this.systemConfig.redis.host}:${this.systemConfig.redis.port}`;
            const client = await createClient({
                url: clientUrl,
                socket: this.systemConfig.redis.socket || undefined,
                username: this.systemConfig.redis.username || undefined,
                password: this.systemConfig.redis.password || undefined,
                name: this.systemConfig.redis.name || undefined,
                database: this.systemConfig.redis.database || undefined,
                modules: this.systemConfig.redis.modules || undefined,
                readonly: !!this.systemConfig.redis.readonly,
                legacyMode: !!this.systemConfig.redis.legacyMode,
                pingInterval: this.systemConfig.redis.pingInterval || undefined,
            })
                .on("error", (e) => {
                    this.fastify.log.error(`Redis ${e}`);
                    process.exit(1);
                })
                .connect();
            this.fastify.log.info(`Connected to Redis Server at ${clientUrl}`);
            client.hereticId = this.systemConfig.id;
            this.fastify.decorate("redis", client);
        }
    }

    async initRateLimit() {
        if (
            this.systemConfig.rateLimit &&
            this.systemConfig.rateLimit.enabled
        ) {
            const config = {
                ...this.systemConfig.rateLimit.global,
            };
            if (this.fastify.redis) {
                config.redis = this.fastify.redis;
            }
            await this.fastify.register(import("./rateLimit.js"), config);
        }
    }

    constructor() {
        this.utils = new Utils(Object.keys(languages));
        this.configLoader = new ConfigLoader();
        // Read configuration files
        try {
            // eslint-disable-next-line no-undef
            this.systemConfig = __non_webpack_require__(
                path.resolve(__dirname, "../site/etc/system.js"),
            );
            // eslint-disable-next-line no-undef
            this.siteConfig = __non_webpack_require__(
                path.resolve(__dirname, "../site/etc/website.js"),
            );
        } catch {
            // eslint-disable-next-line no-console
            console.error(
                `Could not read "system.js" and/or "website.js" configuration files.\nRun the following command to create: npm run configure\nRead documentation for more info.`,
            );
            process.exit(1);
        }
        this.systemConfig.versionHash = crypto
            .createHmac("sha256", this.systemConfig.secret)
            .update(packageJson.version)
            .digest("hex");
        this.systemConfig.secretInt = parseInt(
            crypto
                .createHash("md5")
                .update(this.systemConfig.secret)
                .digest("hex"),
            16,
        );
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
            loggerInstance: new Logger(this.systemConfig).getPino(),
            trustProxy: true,
            ignoreTrailingSlash: this.systemConfig.server.ignoreTrailingSlash,
        });
        [this.defaultLanguage] = Object.keys(languages);
        this.languages = Object.keys(languages);
        this.fastify.register(require("@fastify/formbody"));
        this.fastify.register(require("@fastify/jwt"), {
            secret: this.systemConfig.secret,
        });
        this.fastify.register(require("@fastify/cookie"));
        if (
            this.systemConfig.webSockets ||
            this.systemConfig.webSockets.enabled
        ) {
            this.fastify.register(require("./websocket.js"), {
                options: this.systemConfig.webSockets.options,
            });
        }
        this.wsHandlers = [];
        this.fastify.register(fastifyMultipart);
        this.fastify.register(fastifyURLData);
        this.fastify.decorate("i18nNavigation", buildData.i18nNavigation);
        this.fastify.decorate("siteConfig", this.siteConfig);
        this.fastify.decorate("systemConfig", this.systemConfig);
        this.fastify.decorate("languages", languages);
        this.fastify.decorate("configLoader", this.configLoader);
        this.fastify.decorate("packageJson", packageJson);
        const fastifyDecoratorsList = fastifyDecorators.list();
        for (const decorateItem of fastifyDecoratorsList) {
            this.fastify.decorate(
                decorateItem,
                fastifyDecorators[decorateItem],
            );
        }
        const requestDecoratorsList = requestDecorators.list();
        for (const decorateItem of requestDecoratorsList) {
            this.fastify.decorateRequest(
                decorateItem,
                requestDecorators[decorateItem],
            );
        }
        const replyDecoratorsList = replyDecorators.list();
        for (const decorateItem of replyDecoratorsList) {
            this.fastify.decorateReply(
                decorateItem,
                replyDecorators[decorateItem],
            );
        }
        this.fastify.addHook("preHandler", (request, reply, done) => {
            // Do something if we need to
            done();
        });
        this.fastify.addHook("onRequest", async (req, rep) => {
            req.auth = new Auth(this.fastify, req);
            req.fastify = this.fastify;
            const contentResponse = await routePageContent(this.fastify, req);
            if (contentResponse) {
                rep.code(200).type("text/html").send(contentResponse);
            }
        });
        try {
            this.options = commandLineArgs(
                [
                    {
                        name: "command",
                        defaultOption: true,
                    },
                    {
                        name: "setup",
                        type: Boolean,
                    },
                    {
                        name: "index",
                        type: Boolean,
                    },
                ],
                {
                    stopAtFirstUnknown: true,
                },
            );
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
            this.languageData[lang] = await i18nCore.loadLanguageFile(lang);
            for (const m of buildData.modules) {
                try {
                    const i18nLoader = await import(
                        `#build/loaders/i18n-loader-${m.id}.js`
                    );
                    this.languageData[lang] = {
                        ...this.languageData[lang],
                        ...(await i18nLoader.loadLanguageFile(lang)),
                    };
                } catch {
                    // Ignore
                }
            }
            Object.keys(this.languageData[lang]).map(
                (i) =>
                    (this.languageData[lang][i] = template(
                        this.languageData[lang][i],
                    )),
            );
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
            prefix: "/",
        });
    }

    /*
     * Register routes for all pages
     */
    registerModules() {
        for (const m of buildData.modules) {
            for (const p of m.pages) {
                if (p.type === "userspace") {
                    this.fastify.register(async () => {
                        this.fastify.get(
                            p.routePath || "/",
                            routePageUserspace(
                                m,
                                p,
                                this.languageData,
                                this.defaultLanguage,
                            ),
                        );
                    });
                    if (p.routePath.match(/\/\*$/)) {
                        this.fastify.register(async () => {
                            this.fastify.get(
                                p.routePath.replace(/\/\*$/, ""),
                                routePageUserspace(
                                    m,
                                    p,
                                    this.languageData,
                                    this.defaultLanguage,
                                ),
                            );
                        });
                    }
                    for (const lang of Object.keys(languages)) {
                        if (lang !== this.defaultLanguage) {
                            this.fastify.register(async () => {
                                this.fastify.get(
                                    `/${lang}${p.routePath || "/"}`,
                                    routePageUserspace(
                                        m,
                                        p,
                                        this.languageData,
                                        lang,
                                    ),
                                );
                            });
                            if (p.routePath.match(/\/\*$/)) {
                                this.fastify.register(async () => {
                                    this.fastify.get(
                                        `/${lang}${p.routePath}`.replace(
                                            /\/\*$/,
                                            "",
                                        ),
                                        routePageUserspace(
                                            m,
                                            p,
                                            this.languageData,
                                            this.defaultLanguage,
                                        ),
                                    );
                                });
                            }
                        }
                    }
                }
                if (p.type === "admin") {
                    this.fastify.register(async () => {
                        this.fastify.get(
                            p.routePath,
                            routePageAdmin(
                                m,
                                p,
                                this.languageData,
                                this.defaultLanguage,
                            ),
                        );
                    });
                    for (const lang of Object.keys(languages)) {
                        if (lang !== this.defaultLanguage) {
                            this.fastify.register(async () => {
                                this.fastify.get(
                                    `/${lang}${p.routePath}`,
                                    routePageAdmin(
                                        m,
                                        p,
                                        this.languageData,
                                        lang,
                                    ),
                                );
                            });
                        }
                    }
                }
            }
        }
    }

    /*
     * Register OAuth2 routes for all pages
     */
    async registerOauth2() {
        if (
            !this.systemConfig.oauth2 ||
            !Array.isArray(this.systemConfig.oauth2)
        ) {
            return;
        }
        for (const route of this.systemConfig.oauth2) {
            if (!route.enabled) {
                continue;
            }
            try {
                this.fastify.register(oauthPlugin, route);
                const oa2 = (
                    await import(
                        `../oauth2/${route.name.replace(/^oa2/, "")}.js`
                    )
                ).default;
                this.fastify.register(async () => {
                    this.fastify.get(route.callbackPath, oa2());
                });
            } catch {
                // Ignore
            }
        }
    }

    /*
     * Register error routes (both 404 and 500)
     */
    registerRouteErrors() {
        this.fastify.setNotFoundHandler(
            {
                preHandler: this.fastify.rateLimit
                    ? this.fastify.rateLimit()
                    : undefined,
            },
            async (req, rep) => {
                const language = this.utils.getLanguageFromUrl(req.url);
                const output = req.urlData(null, req).path.match(/^\/api\//)
                    ? apiRoute404(rep, this.languageData, language)
                    : await route404(
                          req,
                          rep,
                          this.languageData,
                          language,
                          this.siteConfig,
                          this.systemConfig,
                          buildData.i18nNavigation,
                          this.configLoader,
                      );
                rep.code(404);
                rep.send(output);
            },
        );
        this.fastify.setErrorHandler(async (err, req, rep) => {
            this.fastify.log.error(err);
            const language = this.utils.getLanguageFromUrl(req.url);
            const output = req.urlData(null, req).path.match(/^\/api\//)
                ? apiRoute500(err, rep, this.languageData, language)
                : await route500(
                      err,
                      rep,
                      this.languageData,
                      language,
                      this.siteConfig,
                  );
            rep.code(err.code === 429 ? 429 : 500);
            rep.send(output);
        });
    }

    /**
     * Register API routes
     */
    async registerRouteAPI() {
        for (const m of buildData.modules.filter((i) => i.api)) {
            const api = (await DynamicLoader.loadAPI(m.path)).default;
            this.fastify.register(async () => {
                api(this.fastify);
            });
        }
    }

    /**
     * Register WebSocket routes
     */
    async registerRouteWebSockets() {
        if (
            !this.systemConfig.webSockets ||
            !this.systemConfig.webSockets.enabled
        ) {
            return;
        }
        for (const m of buildData.modules) {
            // if (m.ws) {
            //     const Ws = await DynamicLoader.loadWS(m.path);
            //     this.wsHandlers.push(new Ws(this.fastify));
            // }
            for (const p of m.pages) {
                if (p.ws) {
                    const Wsp = (
                        await DynamicLoader.loadWS(`${m.path}/${p.id}`)
                    ).default;
                    this.wsHandlers.push(new Wsp(this.fastify));
                }
            }
        }
        this.fastify.register(async (fastify) => {
            fastify.get(
                "/ws",
                {
                    websocket: true,
                },
                async (connection, req) => {
                    const authData = await req.auth.getData(
                        req.auth.methods.COOKIE,
                    );
                    for (const handler of this.wsHandlers) {
                        if (!authData) {
                            try {
                                connection.socket.send(
                                    JSON.stringify({
                                        error: true,
                                        code: 403,
                                        message: "accessDenied",
                                    }),
                                );
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
                            await fastify.redis.set(
                                `${fastify.systemConfig.id}_user_${authData._id.toString()}_${connection.uid.replace(/-/gm, "_")}`,
                                Math.floor(Date.now() / 1000),
                                "ex",
                                120,
                            );
                        } catch {
                            // Ignore
                        }
                    }
                    connection.socket.on("message", async (message) => {
                        for (const handler of this.wsHandlers) {
                            handler.onMessage(connection, req, message);
                        }
                    });
                    connection.socket.on("close", async () => {
                        if (fastify.redis) {
                            try {
                                await fastify.redis.del(
                                    `${fastify.systemConfig.id}_user_${authData._id.toString()}_${connection.uid.replace(/-/gm, "_")}`,
                                );
                            } catch {
                                // Ignore
                            }
                        }
                        for (const handler of this.wsHandlers) {
                            handler.onDisconnect(connection, req);
                        }
                    });
                },
            );
        });
    }

    /*
     * Listen to the specified host and port
     */
    listen() {
        this.fastify.listen({
            port: this.systemConfig.server.port,
            host: this.systemConfig.server.ip,
        });
    }

    /*
     * Connect to the MongoDB
     */

    async connectDatabase() {
        // Create MongoDB client and connect
        if (this.systemConfig.mongo.enabled) {
            const mongoClient = new MongoClient(
                this.systemConfig.mongo.url,
                this.systemConfig.mongo.options || {
                    connectTimeoutMS: 5000,
                },
            );
            mongoClient.on("serverDescriptionChanged", (e) => {
                if (e && e.newDescription && e.newDescription.error) {
                    this.fastify.log.error(
                        "Fatal: connection to MongoDB is broken",
                    );
                    process.exit(1);
                }
            });
            await mongoClient.connect();
            this.fastify.decorate("mongoClient", mongoClient);
            this.fastify.log.info(
                `Connected to Mongo Server: ${this.systemConfig.mongo.url}/${this.systemConfig.mongo.dbName}`,
            );
            // Register MongoDB for Fastify
            this.fastify.register(require("#lib/fastifyMongo.js"), {
                client: mongoClient,
                database: this.systemConfig.mongo.dbName,
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
        for (const m of buildData.modules) {
            try {
                if (m.provider) {
                    const Provider = (
                        await DynamicLoader.loadProvider(`${m.path}/data`)
                    ).default;
                    const provider = new Provider();
                    dataProviders[m.id] = provider;
                }
                for (const p of m.pages) {
                    if (p.provider) {
                        const ProviderPage = (
                            await DynamicLoader.loadProvider(
                                `${m.path}/${p.id}`,
                            )
                        ).default;
                        const providerPage = new ProviderPage();
                        dataProviders[`${m.id}_${p.id}`] = providerPage;
                    }
                }
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error(e);
                // Ignore
            }
        }
        this.fastify.decorate("dataProviders", dataProviders);
    }

    async createIndex(id, collection, fields, direction = "asc") {
        const db = this.fastify.mongoClient.db(
            this.fastify.systemConfig.mongo.dbName,
        );
        const indexCreate = {};
        fields.map((i) => {
            indexCreate[i] = direction === "asc" ? 1 : -1;
            for (const lang of Object.keys(languages)) {
                indexCreate[`${lang}.${i}`] = direction === "asc" ? 1 : -1;
            }
        });
        this.fastify.log.info(`Dropping index: ${collection}_${direction}...`);
        try {
            await db
                .collection(collection)
                .dropIndex(`${collection}_${direction}`);
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

    async createExpireIndex(id, collection, field, seconds) {
        const db = this.fastify.mongoClient.db(
            this.fastify.systemConfig.mongo.dbName,
        );
        const indexExpire = {};
        indexExpire[field] = 1;
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
                name: `${collection}_expire`,
            });
        } catch {
            // Ignore
        }
    }

    async updateSetupVersion(_id) {
        const db = this.fastify.mongoClient.db(
            this.fastify.systemConfig.mongo.dbName,
        );
        await db
            .collection(this.fastify.systemConfig.collections.version)
            .findOneAndUpdate(
                {
                    _id,
                },
                {
                    $set: {
                        value: packageJson.version,
                    },
                },
                {
                    upsert: true,
                },
            );
    }

    async setup(installedVersions, options) {
        for (const m of buildData.modules.filter((i) => i.setup)) {
            if (!installedVersions[m.id] || options.setup) {
                let Setup;
                try {
                    Setup = (await DynamicLoader.loadSetup(m.path)).default;
                } catch (e) {
                    this.fastify.log.error(`Setup error: ${e.message}...`);
                }
                if (Setup) {
                    this.fastify.log.info(
                        `Executing installation script for module: ${m.id}...`,
                    );
                    const setup = new Setup(
                        m.id,
                        this.fastify,
                        {
                            createIndex: this.createIndex.bind(this),
                            createExpireIndex:
                                this.createExpireIndex.bind(this),
                        },
                        installedVersions,
                    );
                    await setup.process();
                    await this.updateSetupVersion(m.id);
                }
            }
        }
    }

    async index() {
        if (
            !this.systemConfig.redis ||
            !this.systemConfig.redis.enabled ||
            !this.systemConfig.redis.stack
        ) {
            return;
        }
        try {
            await this.fastify.redis.ft.dropIndex(
                `${this.fastify.systemConfig.id}-fulltext`,
                {
                    DD: true,
                },
            );
        } catch {
            //
        }
        const indexData = [];
        for (const m of buildData.modules.filter((i) => i.search)) {
            let Index;
            try {
                // Index = (await import(`./#site/../${m.path}/search.js`))
                //     .default;
                Index = (await DynamicLoader.loadSearch(m.path)).default;
            } catch {
                // Ignore
            }
            if (Index) {
                this.fastify.log.info(`Indexing module: ${m.id}...`);
                const index = new Index(m.id, this.fastify);
                indexData.push(...(await index.process()));
            }
        }
        let currentIndex;
        try {
            currentIndex = await this.fastify.redis.ft.info(
                `idx:${this.fastify.systemConfig.id}_fulltext`,
            );
        } catch {
            //
        }
        if (!currentIndex) {
            try {
                await this.fastify.redis.ft.create(
                    `${this.fastify.systemConfig.id}-fulltext`,
                    {
                        route: SchemaFieldTypes.TEXT,
                        url: SchemaFieldTypes.TEXT,
                        language: SchemaFieldTypes.TEXT,
                        title: SchemaFieldTypes.TEXT,
                        content: SchemaFieldTypes.TEXT,
                    },
                    {
                        ON: "HASH",
                        PREFIX: `${this.fastify.systemConfig.id}-fulltext`,
                        LANGUAGE_FIELD: "language",
                    },
                );
            } catch {
                //
            }
        }
        for (const i of indexData) {
            const { id } = i;
            delete i.id;
            await this.fastify.redis.hSet(
                `${this.fastify.systemConfig.id}-fulltext:${id}`,
                i,
            );
        }
    }

    async installedDbVersions() {
        const db = this.fastify.mongoClient.db(
            this.fastify.systemConfig.mongo.dbName,
        );
        try {
            const versionData = {};
            const versionDataDb =
                (await db
                    .collection(this.fastify.systemConfig.collections.version)
                    .find({})
                    .toArray()) || [];
            for (const item of versionDataDb) {
                versionData[item._id] = item.value;
            }
            return versionData;
        } catch {
            return {};
        }
    }
}
