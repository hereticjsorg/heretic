export default (route, languageData, language) => ({
    async handler(req, rep) {
        console.log(`./pages/${route.id}/server.marko`);
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
                title: [languageData[language].title, languageData[language][route.id]],
            },
        });
        rep.type("text/html");
        rep.send(renderPage.getOutput());
    }
});
