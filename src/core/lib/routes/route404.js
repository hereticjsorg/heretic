import error404 from "#core/errors/404/server.marko";
import packageJson from "#root/package.json";

export default async (req, rep, languageData, language, siteConfig, systemConfig, i18nNavigation) => {
    const authData = await req.auth.getData(req.auth.methods.COOKIE);
    const renderPage = await error404.render({
        $global: {
            serializedGlobals: {
                language: true,
                route: true,
                title: true,
                siteTitle: true,
                i18nNavigation: true,
                username: true,
                isAdmin: true,
                systemRoutes: true,
                siteId: true,
                cookieOptions: true,
                webSockets: true,
                authOptions: true,
                mongoEnabled: true,
                demo: true,
                darkModeEnabled: true,
                passwordPolicy: true,
                packageJson: true,
            },
            passwordPolicy: systemConfig.passwordPolicy,
            darkModeEnabled: systemConfig.darkModeEnabled || systemConfig.heretic.darkModeEnabled,
            authOptions: systemConfig.auth,
            mongoEnabled: systemConfig.mongo.enabled,
            language,
            route: null,
            title: languageData[language]["404"](),
            siteTitle: siteConfig.title[language],
            i18nNavigation: i18nNavigation[language],
            username: authData ? authData.username : null,
            isAdmin: authData && authData.groupData && authData.groupData.find(i => i.id === "admin" && i.value === true),
            systemRoutes: systemConfig.routes,
            siteId: systemConfig.id,
            cookieOptions: systemConfig.cookieOptions,
            webSockets: systemConfig.webSockets || {},
            demo: systemConfig.demo,
            packageJson,
        },
    });
    rep.type("text/html");
    return renderPage.getOutput();
};
