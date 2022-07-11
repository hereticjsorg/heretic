import error404 from "../errors/404/server.marko";

export default async (rep, languageData, language, siteMeta, i18nNavigation) => {
    const renderModule = await error404.render({
        $global: {
            serializedGlobals: {
                language: true,
                route: true,
                title: true,
                siteTitle: true,
                i18nNavigation: true,
            },
            language,
            route: null,
            title: languageData[language]["404"],
            siteTitle: siteMeta.title[language],
            i18nNavigation: i18nNavigation[language],
        },
    });
    rep.type("text/html");
    return renderModule.getOutput();
};
