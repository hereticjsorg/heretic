import Fastify from "fastify";
import path from "path";
import fs from "fs-extra";
import fastifyStatic from "fastify-static";

import routePage from "./routePage";
import route404 from "./route404";
import routes from "./build/routes.json";
import languages from "../etc/languages.json";
import i18nNavigation from "./build/i18n-navigation.json";

(async () => {
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
        const config = await fs.readJSON(path.resolve(`${__dirname}/../etc/config.json`));
        const siteMeta = await fs.readJSON(path.resolve(`${__dirname}/../etc/meta.json`));
        const defaultLanguage = Object.keys(languages)[0];
        const fastify = Fastify({
            trustProxy: true,
            ignoreTrailingSlash: true,
        });
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
            route404(rep, languageData, defaultLanguage, siteMeta, i18nNavigation);
        });
        await fastify.listen(config.server.port, config.server.ip);
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
})();
