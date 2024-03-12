import {
    createHash,
} from "crypto";
import languages from "#etc/languages.json";

export default async (fastify, req) => {
    if (req && req.url && fastify.systemConfig.mongo.enabled) {
        try {
            const languagesList = Object.keys(languages);
            const urlParts = req.url.split(/\//).filter(p => p);
            let language = languagesList[0];
            for (const lang of languagesList) {
                if (urlParts[0] === languagesList[0]) {
                    continue;
                }
                if (urlParts[0] === lang) {
                    urlParts.shift();
                    language = lang;
                    break;
                }
            }
            const url = urlParts.join("/");
            const pagePathHash = createHash("sha256").update(url).digest("base64");
            const collection = fastify.mongo.db.collection(fastify.systemConfig.collections.content);
            const page = await collection.findOne({
                pagePathHash,
            });
            if (page && page[language]) {
                const authData = req.auth ? await req.auth.getData(req.auth.methods.COOKIE) : null;
                const pageData = (await import(`#core/content/server.marko`)).default;
                const renderPage = await pageData.render({
                    $global: {
                        serializedGlobals: {
                            language: true,
                            route: true,
                            title: true,
                            siteTitle: true,
                            siteUrl: true,
                            i18nNavigation: true,
                            description: true,
                            systemRoutes: true,
                            siteId: true,
                            cookieOptions: true,
                            username: true,
                            isAdmin: true,
                            webSockets: true,
                            authOptions: true,
                            mongoEnabled: true,
                            demo: true,
                            darkModeEnabled: true,
                            cookiesUserCheck: true,
                            passwordPolicy: true,
                            oa2: true,
                            packageJson: true,
                            contentData: true,
                        },
                        oa2: fastify.systemConfig.oauth2 && Array.isArray(fastify.systemConfig.oauth2) ? fastify.systemConfig.oauth2.map(i => ({
                            name: i.name,
                            icon: i.icon,
                            path: i.startRedirectPath,
                            enabled: i.enabled,
                        })) : [],
                        passwordPolicy: fastify.systemConfig.passwordPolicy,
                        authOptions: fastify.systemConfig.auth,
                        darkModeEnabled: fastify.systemConfig.darkModeEnabled || fastify.systemConfig.heretic.darkModeEnabled,
                        cookiesUserCheck: fastify.systemConfig.cookieOptions.userCheck || false,
                        mongoEnabled: fastify.systemConfig.mongo.enabled,
                        language,
                        route: `/${url}`,
                        title: page[language].title,
                        siteTitle: fastify.siteConfig.title[language],
                        siteUrl: fastify.siteConfig.url,
                        i18nNavigation: fastify.i18nNavigation[language],
                        description: "",
                        t: id => id,
                        systemRoutes: fastify.systemConfig.routes,
                        siteId: fastify.systemConfig.id,
                        cookieOptions: fastify.systemConfig.cookieOptions,
                        username: authData ? authData.username : null,
                        isAdmin: authData && authData.groupData && authData.groupData.find(i => i.id === "admin" && i.value === true),
                        webSockets: fastify.systemConfig.webSockets || {},
                        demo: fastify.systemConfig.demo,
                        packageJson: fastify.packageJson,
                        contentData: page[language],
                    },
                });
                return renderPage.getOutput();
            }
        } catch (e) {
            // Ignore
        }
    }
};
