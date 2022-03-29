import Fastify from "fastify";
import path from "path";
import fs from "fs-extra";
import fastifyStatic from "fastify-static";
import fastifyURLData from "./core/urlData";
import logger from "./core/logger";
import Utils from "./core/utils";

import routePage from "./routePage";
import route404 from "./route404";
import route500 from "./route500";
import routes from "./build/routes.json";
import languages from "./config/languages.json";
import i18nNavigation from "./build/i18n-navigation.json";

(async () => {
    let fastify;
    try {
        fastify = Fastify({
            logger,
            trustProxy: true,
            ignoreTrailingSlash: true,
        });
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        process.exit(1);
    }
    try {
        const languageData = {};
        let i18nUser = true;
        for (const lang of Object.keys(languages)) {
            languageData[lang] = {
                ...require(`./translations/core/${lang}.json`),
            };
            try {
                await fs.access(`./translations/${lang}.json`, fs.F_OK);
                languageData[lang] = {
                    ...languageData[lang],
                    ...require(`./translations/${lang}.json`),
                };
            } catch {
                i18nUser = false;
            }
        }
        let config;
        let siteMeta;
        let configLocationEtc = "..";
        try {
            await fs.access(path.resolve(__dirname, "..", "etc", "system.json"), fs.F_OK);
        } catch {
            configLocationEtc = "";
        }
        try {
            fastify.log.info;
            config = await fs.readJSON(path.resolve(__dirname, configLocationEtc, "etc", "system.json"));
            siteMeta = await fs.readJSON(path.resolve(__dirname, configLocationEtc, "etc", "meta.json"));
        } catch {
            fastify.log.error(`Could not read "system.json" and/or "meta.json" configuration files.`);
            process.exit(1);
        }
        const defaultLanguage = Object.keys(languages)[0];
        const utils = new Utils(Object.keys(languages));
        fastify.register(fastifyURLData);
        fastify.decorate("i18nNavigation", i18nNavigation);
        fastify.decorate("i18nUser", i18nUser);
        fastify.decorate("siteMeta", siteMeta);
        if (config.server.static) {
            fastify.register(fastifyStatic, {
                root: path.resolve(__dirname, "public"),
                prefix: "/"
            });
        }
        for (const route of routes) {
            fastify.get(route.path || "/", routePage(route, languageData, defaultLanguage));
            for (const lang of Object.keys(languages)) {
                if (lang !== defaultLanguage) {
                    fastify.get(`/${lang}${route.path}`, routePage(route, languageData, lang));
                }
            }
        }
        fastify.setNotFoundHandler(async (req, rep) => {
            const language = utils.getLanguageFromUrl(req.url);
            const output = await route404(rep, languageData, language, siteMeta, i18nNavigation);
            rep.type("text/html");
            rep.code(404);
            rep.send(output);
        });
        fastify.setErrorHandler(async (err, req, rep) => {
            fastify.log.error(err);
            const language = utils.getLanguageFromUrl(req.url);
            const output = await route500(err, rep, languageData, language, siteMeta);
            rep.type("text/html");
            rep.code(500);
            rep.send(output);
        });
        await fastify.listen(config.server.port, config.server.ip);
    } catch (e) {
        fastify.log.error(e.message);
        process.exit(1);
    }
})();
