import error404 from "#site/errors/404/server.marko";

export default async (
    req,
    rep,
    languageData,
    language,
    siteConfig,
    systemConfig,
    i18nNavigation,
    configLoader,
) => {
    const navigation = await configLoader.loadNavigationConfig();
    const authData = await req.auth.getData(req.auth.methods.COOKIE);
    const renderPage = await error404.render({
        $global: {
            serializedGlobals: {
                language: true,
                route: true,
                title: true,
                siteTitle: true,
                siteUrl: true,
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
                cookiesUserCheck: true,
                passwordPolicy: true,
                packageJson: true,
                queryString: true,
                url: true,
                navigation: true,
            },
            passwordPolicy: systemConfig.passwordPolicy,
            darkModeEnabled:
                systemConfig.darkModeEnabled ||
                systemConfig.heretic.darkModeEnabled,
            cookiesUserCheck: systemConfig.cookieOptions.userCheck || false,
            authOptions: systemConfig.auth,
            mongoEnabled: systemConfig.mongo.enabled,
            language,
            route: null,
            title: languageData[language]["404"](),
            siteTitle: siteConfig.title[language],
            siteUrl: siteConfig.url,
            i18nNavigation: i18nNavigation[language],
            username: authData ? authData.username : null,
            isAdmin:
                authData &&
                authData.groupData &&
                authData.groupData.find(
                    (i) => i.id === "admin" && i.value === true,
                ),
            systemRoutes: systemConfig.routes,
            siteId: systemConfig.id,
            cookieOptions: systemConfig.cookieOptions,
            webSockets: systemConfig.webSockets || {},
            demo: systemConfig.demo,
            packageJson: configLoader.getPackageJson(),
            queryString: req.query,
            url: req.url,
            navigation: navigation.userspace,
        },
    });
    rep.type("text/html");
    return renderPage.getOutput();
};
