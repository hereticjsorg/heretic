const languages = Object.keys(require("../../../config/languages.json"));
const routesData = require("../../../build/build.json");

export default (route, languageData, language) => ({
    async handler(req, rep) {
        const authData = await req.auth.getData(req.auth.methods.COOKIE);
        if (route.dir === "_signIn" && authData) {
            return rep.code(302).redirect(languages[0] === language ? this.siteConfig.routes.admin : `/${language}${this.siteConfig.routes.admin}`);
        }
        if (route.dir !== "_signIn" && !authData) {
            return rep.code(302).redirect(languages[0] === language ? `${this.siteConfig.routes.signInAdmin}?r=${route.path}` : `/${language}${this.siteConfig.routes.signInAdmin}?r=/${language}${route.path}`);
        }
        if (route.dir !== "_signIn" && (!authData || !authData.groupData || !authData.groupData.find(i => i.id === "admin" && i.value === true))) {
            return rep.code(302).redirect(languages[0] === language ? "/" : `/${language}`);
        }
        const translationData = routesData.translations.admin.find(i => i.id === route.id);
        const page = route.core ? (await import(`../../pages/${route.dir}/admin/server.marko`)).default : (await import(`../../../pages/${route.dir}/admin/server.marko`)).default;
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
                    userData: true,
                    systemRoutes: true,
                    webSockets: true,
                },
                language,
                route: route.id,
                title: translationData.title[language],
                siteTitle: this.siteMeta.title[language],
                i18nNavigation: this.i18nNavigation.admin[language],
                siteId: this.siteConfig.id,
                cookieOptions: this.siteConfig.cookieOptions,
                t: id => languageData[language] && languageData[language][id] ? `${languageData[language][id]}` : id,
                userData: authData ? {
                    id: String(authData._id),
                    username: authData.username,
                } : {},
                systemRoutes: this.siteConfig.routes,
                webSockets: this.siteConfig.webSockets || {},
            },
        });
        rep.type("text/html");
        rep.send(renderPage.getOutput());
    }
});
