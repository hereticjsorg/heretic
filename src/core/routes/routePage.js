const pageTranslations = require(`../../build/translations.json`);

export default (route, languageData, language) => ({
    async handler(req, rep) {
        const translationData = pageTranslations.find(i => i.id === route.id);
        const page = (await import(`../../pages/${route.id}/server.marko`)).default;
        const renderPage = await page.render({
            $global: {
                serializedGlobals: {
                    language: true,
                    route: true,
                    title: true,
                    siteTitle: true,
                    i18nNavigation: true,
                    description: true,
                },
                language,
                route: route.id,
                title: translationData.title[language],
                siteTitle: this.siteMeta.title[language],
                i18nNavigation: this.i18nNavigation[language],
                description: translationData.description && translationData.description[language] ? translationData.description[language] : null,
            },
        });
        rep.type("text/html");
        rep.send(renderPage.getOutput());
    }
});
