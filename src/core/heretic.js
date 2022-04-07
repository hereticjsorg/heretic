import Fastify from "fastify";
import path from "path";
import fs from "fs-extra";
import fastifyStatic from "fastify-static";

import routePage from "./routes/routePage";
import route404 from "./routes/route404";
import route500 from "./routes/route500";
import routes from "../build/routes.json";
import logger from "./logger";
import Utils from "./utils";
import fastifyURLData from "./urlData";
import i18nNavigation from "../build/i18n-navigation.json";
import languages from "../config/languages.json";

export default class {
    constructor() {
        try {
            this.fastify = Fastify({
                logger,
                trustProxy: true,
                ignoreTrailingSlash: true,
            });
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
            process.exit(1);
        }
        this.languageData = {};
        for (const lang of Object.keys(languages)) {
            let languageDataCore = {};
            try {
                languageDataCore = require(`../translations/core/${lang}.json`);
            } catch {
                // Ignore
            }
            let languageDataUser = {};
            try {
                languageDataUser = require(`../translations/user/${lang}.json`);
            } catch {
                // Ignore
            }
            this.languageData[lang] = {
                ...languageDataUser,
                ...languageDataCore,
            };
        }
        let configLocationEtc = "..";
        if (!fs.existsSync(path.resolve(__dirname, "..", "..", "etc", "system.json"))) {
            configLocationEtc = "";
        }
        try {
            this.config = fs.readJSONSync(path.resolve(__dirname, configLocationEtc, "..", "etc", "system.json"));
            this.siteMeta = fs.readJSONSync(path.resolve(__dirname, configLocationEtc, "..", "etc", "meta.json"));
        } catch {
            this.fastify.log.error(`Could not read "system.json" and/or "meta.json" configuration files.`);
            process.exit(1);
        }
        [this.defaultLanguage] = Object.keys(languages);
        this.utils = new Utils(Object.keys(languages));
        this.fastify.register(fastifyURLData);
        this.fastify.decorate("i18nNavigation", i18nNavigation);
        this.fastify.decorate("siteMeta", this.siteMeta);
    }

    serveStaticContent() {
        this.fastify.register(fastifyStatic, {
            root: path.resolve(__dirname, "public"),
            prefix: "/"
        });
    }

    registerRoutePages() {
        for (const route of routes) {
            this.fastify.get(route.path || "/", routePage(route, this.languageData, this.defaultLanguage));
            for (const lang of Object.keys(languages)) {
                if (lang !== this.defaultLanguage) {
                    this.fastify.get(`/${lang}${route.path}`, routePage(route, this.languageData, lang));
                }
            }
        }
    }

    registerRouteErrors() {
        this.fastify.setNotFoundHandler(async (req, rep) => {
            const language = this.utils.getLanguageFromUrl(req.url);
            const output = await route404(rep, this.languageData, language, this.siteMeta, i18nNavigation);
            rep.type("text/html");
            rep.code(404);
            rep.send(output);
        });
        this.fastify.setErrorHandler(async (err, req, rep) => {
            this.fastify.log.error(err);
            const language = this.utils.getLanguageFromUrl(req.url);
            const output = await route500(err, rep, this.languageData, language, this.siteMeta);
            rep.type("text/html");
            rep.code(500);
            rep.send(output);
        });
    }

    listen() {
        this.fastify.listen(this.config.server.port, this.config.server.ip);
    }

    getFastifyInstance() {
        return this.fastify;
    }

    getConfigSystem() {
        return this.config;
    }

    getConfigMeta() {
        return this.meta;
    }
}
