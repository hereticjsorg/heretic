import Fastify from "fastify";
import path from "path";
import fs from "fs-extra";
import fastifyStatic from "fastify-static";

import routePage from "./routePage";
import route404 from "./route404";
import routes from "../etc/routes.json";
import languages from "../etc/languages.json";

(async () => {
    const languageData = {};
    for (const lang of Object.keys(languages)) {
        languageData[lang] = {
            ...require(`./translations/${lang}.json`),
            ...require(`./translations/core/${lang}.json`),
        };
    }
    const config = await fs.readJSON(path.resolve(`${__dirname}/../etc/config.json`));
    const defaultLanguage = Object.keys(languages)[0];
    const fastify = Fastify({
        trustProxy: true,
        ignoreTrailingSlash: true,
    });
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
        route404(rep, languageData, defaultLanguage);
    });
    await fastify.listen(config.server.port, config.server.ip);
})();
