const routesData = require("../../../build/build.json");

export default (route, languageData, language) => ({
    async handler(req, rep) {
        const authData = await req.auth.getData(req.auth.methods.COOKIE);
        const translationData = routesData.translations.userspace.find(i => i.id === route.id);
        const module = (await import(`../../../modules/${route.prefix}/${route.dir}/userspace/server.marko`)).default;
        const renderPage = await module.render({
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
                },
                language,
                route: route.id,
                title: translationData.title[language],
                siteTitle: this.siteMeta.title[language],
                i18nNavigation: this.i18nNavigation.userspace[language],
                description: translationData.description && translationData.description[language] ? translationData.description[language] : null,
                t: id => languageData[language] && languageData[language][id] ? `${languageData[language][id]}` : id,
                systemRoutes: this.siteConfig.routes,
                siteId: this.siteConfig.id,
                cookieOptions: this.siteConfig.cookieOptions,
                username: authData ? authData.username : null,
                isAdmin: authData && authData.groupData && authData.groupData.find(i => i.id === "admin" && i.value === true),
                webSockets: this.siteConfig.webSockets || {},
            },
        });
        rep.type("text/html");
        rep.send(renderPage.getOutput());
    }
});
