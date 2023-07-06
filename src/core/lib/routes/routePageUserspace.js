const buildData = require("#build/build.json");

export default (m, page, languageData, language) => ({
    async handler(req, rep) {
        const authData = await req.auth.getData(req.auth.methods.COOKIE);
        const translationData = buildData.modules.find(i => i.id === m.id).pages.find(i => i.id === page.id).metaData;
        const pageData = (await import(`#src/../${m.path}/${page.id}/server.marko`)).default;
        const renderPage = await pageData.render({
            $global: {
                serializedGlobals: {
                    language: true,
                    route: true,
                    title: true,
                    siteTitle: true,
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
                    passwordPolicy: true,
                    oa2: true,
                },
                oa2: this.systemConfig.oauth2 && Array.isArray(this.systemConfig.oauth2) ? this.systemConfig.oauth2.map(i => ({
                    name: i.name,
                    icon: i.icon,
                    path: i.startRedirectPath,
                    enabled: i.enabled,
                })) : [],
                passwordPolicy: this.systemConfig.passwordPolicy,
                authOptions: this.systemConfig.auth,
                darkModeEnabled: this.systemConfig.darkModeEnabled,
                mongoEnabled: this.systemConfig.mongo.enabled,
                language,
                route: `${m.id}_${page.id}`,
                title: translationData.title[language],
                siteTitle: this.siteConfig.title[language],
                i18nNavigation: this.i18nNavigation[language],
                description: translationData.description && translationData.description[language] ? translationData.description[language] : null,
                t: id => languageData[language] && languageData[language][id] ? typeof languageData[language][id] === "function" ? languageData[language][id]() : `${languageData[language][id]}` : id,
                systemRoutes: this.systemConfig.routes,
                siteId: this.systemConfig.id,
                cookieOptions: this.systemConfig.cookieOptions,
                username: authData ? authData.username : null,
                isAdmin: authData && authData.groupData && authData.groupData.find(i => i.id === "admin" && i.value === true),
                webSockets: this.systemConfig.webSockets || {},
                demo: this.systemConfig.demo,
            },
        });
        rep.type("text/html");
        rep.send(renderPage.getOutput());
    }
});
