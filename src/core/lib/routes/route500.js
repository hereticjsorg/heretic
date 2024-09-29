import error500 from "#site/errors/500/server.marko";

export default async (err, rep, languageData, language, siteConfig) => {
    let title;
    let message;
    err.code = err.code || err.statusCode || 500;
    switch (err.code) {
        case 429:
            title = languageData[language].rateLimitErrorTitle();
            message = languageData[language].rateLimitErrorMessage();
            break;
        default:
            title = languageData[language].internalServerErrorTitle();
            message = languageData[language].internalServerErrorMessage();
    }
    const renderPage = await error500.render({
        siteTitle: siteConfig.title[language],
        title,
        message,
        code: err.code || 500,
    });
    rep.type("text/html");
    return renderPage.getOutput();
};
