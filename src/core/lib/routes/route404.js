import error404 from "../../errors/404/server.marko";

export default async (req, rep, languageData, language, siteMeta, siteConfig, i18nNavigation) => {
    const authData = await req.auth.getData(req.auth.methods.COOKIE);
    const renderPage = await error404.render({
        $global: {
            serializedGlobals: {
                language: true,
                route: true,
                title: true,
                siteTitle: true,
                i18nNavigation: true,
                username: true,
                systemRoutes: true,
            },
            language,
            route: null,
            title: languageData[language]["404"],
            siteTitle: siteMeta.title[language],
            i18nNavigation: i18nNavigation[language],
            username: authData ? authData.username : null,
            systemRoutes: siteConfig.routes,
        },
    });
    rep.type("text/html");
    return renderPage.getOutput();
};
