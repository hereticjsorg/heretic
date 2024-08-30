export default (err, rep, languageData, language) => {
    rep.type("application/json");
    let errorMessage;
    switch (err.code) {
        case 429:
            errorMessage = languageData[language].rateLimitErrorMessage;
            break;
        default:
            errorMessage = languageData[language].internalServerErrorMessage;
    }
    return {
        error: 500,
        errorMessage,
    };
};
