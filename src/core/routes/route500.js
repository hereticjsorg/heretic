import error500 from "../../errors/500/server.marko";

export default async (err, rep, languageData, language, siteMeta) => {
    let title;
    let message;
    switch (err.code) {
    case 429:
        title = languageData[language].rateLimitErrorTitle;
        message = languageData[language].rateLimitErrorMessage;
        break;
    default:
        title = languageData[language].internalServerErrorTitle;
        message = languageData[language].internalServerErrorMessage;
    }
    const renderPage = await error500.render({
        siteTitle: siteMeta.title[language],
        title,
        message,
        code: err.code,
    });
    rep.type("text/html");
    return renderPage.getOutput();
};
