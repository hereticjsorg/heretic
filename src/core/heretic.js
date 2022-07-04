import Fastify from "fastify";
import Redis from "ioredis";
import path from "path";
import fs from "fs-extra";
import crypto from "crypto";

import hereticRateLimit from "./rateLimit";
import routeModuleFrontend from "./routes/routeModuleFrontend";
import routeModuleAdmin from "./routes/routeModuleAdmin";
import route404 from "./routes/route404";
import route500 from "./routes/route500";
import apiRoute404 from "./routes/route404-api";
import apiRoute500 from "./routes/route500-api";
import routes from "../build/routes.json";
import apiModules from "../build/api-modules.json";
import apiCore from "../build/api-core.json";
import Logger from "./logger";
import Utils from "./utils";
import fastifyURLData from "./urlData";
import fastifyMultipart from "./multipart";
import i18nCore from "../build/i18n-loader-core.js";
import i18nTranslations from "../build/translated-modules.json";
import i18nNavigation from "../build/i18n-navigation.json";
import languages from "../config/languages.json";
import navigation from "../config/navigation.json";

/**
 * Main Heretic class used to load configs,
 * initialize Fastify and its plugins
 */
export default class {
    constructor() {
        // Read configuration files
        try {
            this.config = fs.existsSync(path.resolve(__dirname, "system.json")) ? fs.readJSONSync(path.resolve(__dirname, "system.json")) : fs.readJSONSync(path.resolve(__dirname, "..", "etc", "system.json"));
            this.siteMeta = fs.existsSync(path.resolve(__dirname, "meta.json")) ? fs.readJSONSync(path.resolve(__dirname, "meta.json")) : fs.readJSONSync(path.resolve(__dirname, "..", "etc", "meta.json"));
        } catch {
            // eslint-disable-next-line no-console
            console.error(`Could not read "system.json" and/or "meta.json" configuration files.\nRun the following command to create: npm run setup\nRead documentation for more info.`);
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
        this.fastify.register(fastifyMultipart);
        this.fastify.register(fastifyURLData);
        this.fastify.decorate("i18nNavigation", i18nNavigation);
        this.fastify.decorate("siteMeta", this.siteMeta);
        this.fastify.decorate("siteConfig", this.config);
        this.fastify.decorate("languages", languages);
        this.fastify.decorate("navigation", navigation);
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
            for (const module of i18nTranslations) {
                const i18nLoader = await import(`../build/i18n-loader-${module}.js`);
                this.languageData[lang] = {
                    ...this.languageData[lang],
                    ...await i18nLoader.loadLanguageFile(lang),
                };
            }
        }
    }

    /**
     * Register fastify-static plugin to serve static
     * assets (useful in development mode)
     */
    serveStaticContent() {
        this.fastify.register(require("@fastify/static"), {
            root: path.resolve(__dirname, "public"),
            prefix: "/"
        });
    }

    /**
     * Register routes for all modules
     */
    registerRouteModulesFrontend() {
        for (const route of routes) {
            this.fastify.get(route.path || "/", routeModuleFrontend(route, this.languageData, this.defaultLanguage));
            for (const lang of Object.keys(languages)) {
                if (lang !== this.defaultLanguage) {
                    this.fastify.get(`/${lang}${route.path}`, routeModuleFrontend(route, this.languageData, lang));
                }
            }
        }
    }

    /**
     * Register admin routes for all modules
     */
     registerRouteModulesAdmin() {
        for (const route of routes) {
            this.fastify.get(route.path ? `/admin${route.path}` : "/admin", routeModuleAdmin(route, this.languageData, this.defaultLanguage));
            for (const lang of Object.keys(languages)) {
                if (lang !== this.defaultLanguage) {
                    this.fastify.get(`/${lang}/admin${route.path}`, routeModuleAdmin(route, this.languageData, lang));
                }
            }
        }
    }

    /**
     * Register error routes (both 404 and 500)
     */
    registerRouteErrors() {
        this.fastify.setNotFoundHandler(async (req, rep) => {
            const language = this.utils.getLanguageFromUrl(req.url);
            const output = req.urlData(null, req).path.match(/^\/api\//) ? apiRoute404(rep, this.languageData, language) : await route404(rep, this.languageData, language, this.siteMeta, i18nNavigation);
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
        for (const module of apiCore) {
            const api = await import(`../api/${module}/index.js`);
            api.default(this.fastify);
        }
        for (const module of apiModules) {
            const api = await import(`../modules/${module}/api/index.js`);
            api.default(this.fastify);
        }
    }

    /**
     * Listen to the specified host and port
     */
    listen() {
        this.fastify.listen({
            port: this.config.server.port,
            host: this.config.server.ip
        });
    }

    /**
     * This method returns current Fastify instance
     * @returns {Object} fastify object
     */
    getFastifyInstance() {
        return this.fastify;
    }

    /**
     * This method returns system configuration data (system.json)
     * @returns {Object} configuration data object (JSON)
     */
    getConfigSystem() {
        return this.config;
    }

    /**
     * This method returns site metadata (meta.json)
     * @returns {Object} configuration data object (JSON)
     */
    getConfigMeta() {
        return this.meta;
    }
}
