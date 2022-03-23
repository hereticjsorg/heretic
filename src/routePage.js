const pageTranslations = require(`./build/translations.json`);

export default (route, languageData, language) => ({
    async handler(req, rep) {
        const translationData = pageTranslations.find(i => i.id === route.id);
        const page = (await import(`./pages/${route.id}/server.marko`)).default;
        const renderPage = await page.render({
            $global: {
                serializedGlobals: {
                    language: true,
                    route: true,
                    title: true,
                },
                language,
                route: route.id,
                title: [languageData[language].title, translationData.title[language]],
            },
        });
        rep.type("text/html");
        rep.send(renderPage.getOutput());
    }
});
