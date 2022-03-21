import error404 from "./errors/404/server.marko";

export default async (rep, languageData, language) => {
    const renderPage = await error404.render({
        $global: {
            serializedGlobals: {
                language: true,
                route: true,
                title: true,
            },
            language,
            route: null,
            title: [languageData[language].title, languageData[language]["404"]],
        },
    });
    rep.type("text/html");
    rep.code(404);
    rep.send(renderPage.getOutput());
};
