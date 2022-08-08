const pageTranslations = require("../../../build/translations.json");

export default (route, languageData, language) => ({
    async handler(req, rep) {
        const authData = await req.auth.getData(req.auth.methods.COOKIE);
        const translationData = pageTranslations.find(i => i.id === route.id);
        const page = (await import(`../../../modules/${route.dir}/frontend/server.marko`)).default;
        const renderPage = await page.render({
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
                },
                language,
                route: route.id,
                title: translationData.title[language],
                siteTitle: this.siteMeta.title[language],
                i18nNavigation: this.i18nNavigation.frontend[language],
                description: translationData.description && translationData.description[language] ? translationData.description[language] : null,
                t: id => languageData[language] && languageData[language][id] ? `${languageData[language][id]}` : id,
                systemRoutes: this.siteConfig.routes,
                siteId: this.siteConfig.id,
                cookieOptions: this.siteConfig.cookieOptions,
                username: authData ? authData.username : null,
            },
        });
        rep.type("text/html");
        rep.send(renderPage.getOutput());
    }
});
