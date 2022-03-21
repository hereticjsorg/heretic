module.exports = {
    loadLanguageFile: async lang => {
        let translationCore;
        let translationUser;
        switch (lang) {
        case "ru-ru":
            translationCore = await import(/* webpackChunkName: "lang-core-ru-ru" */ `./translations/core/ru-ru.json`);
            translationUser = await import(/* webpackChunkName: "lang-ru-ru" */ `./translations/ru-ru.json`);
            break;
        case "en-us":
            translationCore = await import(/* webpackChunkName: "lang-core-en-us" */ `./translations/core/en-us.json`);
            translationUser = await import(/* webpackChunkName: "lang-en-us" */ `./translations/en-us.json`);
            break;
        default:
            return null;
        }
        return {
            ...translationCore,
            ...translationUser
        };
    },
};
