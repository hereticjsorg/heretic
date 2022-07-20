import crypto from "crypto";

const languages = Object.keys(require("../../../config/languages.json"));
const pageTranslations = require("../../../build/translations-admin.json");

export default (route, languageData, language) => ({
    async handler(req, rep) {
        const authData = await req.auth.getData(req.auth.methods.COOKIE);
        if (route.dir === "_login" && authData) {
            return rep.code(302).redirect(languages[0] === language ? `${this.siteConfig.routes.admin}?_=${crypto.randomUUID()}` : `/${language}${this.siteConfig.routes.admin}?_=${crypto.randomUUID()}`);
        }
        if (route.dir !== "_login" && !authData) {
            return rep.code(302).redirect(languages[0] === language ? `${this.siteConfig.routes.login}?_=${crypto.randomUUID()}&r=${route.path}` : `/${language}${this.siteConfig.routes.login}?_=${crypto.randomUUID()}&r=/${language}${route.path}`);
        }
        const translationData = pageTranslations.find(i => i.id === route.id);
        const page = route.core ? (await import(`../../modules/${route.dir}/admin/server.marko`)).default : (await import(`../../../modules/${route.dir}/admin/server.marko`)).default;
        const renderPage = await page.render({
            $global: {
                serializedGlobals: {
                    language: true,
                    route: true,
                    title: true,
                    siteTitle: true,
                    i18nNavigation: true,
                    siteId: true,
                    cookieOptions: true,
                },
                language,
                route: route.id,
                title: translationData.title[language],
                siteTitle: this.siteMeta.title[language],
                i18nNavigation: this.i18nNavigation.admin[language],
                siteId: this.siteConfig.id,
                cookieOptions: this.siteConfig.cookieOptions,
                t: id => languageData[language] && languageData[language][id] ? `${languageData[language][id]}` : id,
            },
        });
        rep.type("text/html");
        rep.send(renderPage.getOutput());
    }
});
