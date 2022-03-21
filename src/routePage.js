export default (route, languageData, language) => ({
    async handler(req, rep) {
        const page = (await import(`./pages/${route.name}/server.marko`)).default;
        const renderPage = await page.render({
            $global: {
                serializedGlobals: {
                    language: true,
                    route: true,
                    title: true,
                },
                language,
                route: route.name,
                title: [languageData[language].title, languageData[language][route.name]],
            },
        });
        rep.type("text/html");
        rep.send(renderPage.getOutput());
    }
});
