import error500 from "./errors/500/server.marko";

export default async (err, rep, languageData, language, siteMeta) => {
    const renderPage = await error500.render({
        title: languageData[language].internalServerErrorTitle,
        siteTitle: siteMeta.title[language],
        message: languageData[language].internalServerErrorMessage
    });
    return renderPage.getOutput();
};
