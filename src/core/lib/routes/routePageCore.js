const routesData = require("../../../build/build.json");

export default (route, languageData, language) => ({
    async handler(req, rep) {
        const authData = await req.auth.getData(req.auth.methods.HEADERS);
        const translationData = routesData.translations.core.find(i => i.id === route.id);
        const page = (await import(`../../pages/${route.dir}/userspace/server.marko`)).default;
        const renderPage = await page.render({
            $global: {
                serializedGlobals: {
                    language: true,
                    route: true,
                    title: true,
                    siteTitle: true,
                    i18nNavigation: true,
                    siteId: true,
                    cookieOptions: true,
                    userData: true,
                    systemRoutes: true,
                    username: true,
                    isAdmin: true,
                    webSockets: true,
                },
                language,
                route: route.id,
                title: translationData.title[language],
                siteTitle: this.siteMeta.title[language],
                i18nNavigation: this.i18nNavigation.admin[language],
                siteId: this.siteConfig.id,
                cookieOptions: this.siteConfig.cookieOptions,
                t: id => languageData[language] && languageData[language][id] ? `${languageData[language][id]}` : id,
                systemRoutes: this.siteConfig.routes,
                username: authData ? authData.username : null,
                isAdmin: authData && authData.groupData && authData.groupData.find(i => i.id === "admin" && i.value === true) ? this.siteConfig.routes.admin : false,
                webSockets: this.siteConfig.webSockets || {},
            },
        });
        rep.type("text/html");
        rep.send(renderPage.getOutput());
    }
});
