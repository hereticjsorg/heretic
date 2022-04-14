export default (rep, languageData, language) => {
    rep.type("application/json");
    return {
        error: 404,
        errorMessage: languageData[language]["404"],
    };
};
