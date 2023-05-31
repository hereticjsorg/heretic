const languages = Object.keys(require("../../../../etc/languages.json"));
const routesData = require("../../../build/build.json");

export default (route, languageData, language) => ({
    async handler(req, rep) {
        const authData = await req.auth.getData(req.auth.methods.COOKIE);
        if (route.dir === "signIn" && authData) {
            return rep.code(302).redirect(languages[0] === language ? this.systemConfig.routes.admin : `/${language}${this.systemConfig.routes.admin}`);
        }
        if (route.dir !== "signIn" && !authData) {
            return rep.code(302).redirect(languages[0] === language ? `${this.systemConfig.routes.signInAdmin}?r=${route.path}` : `/${language}${this.systemConfig.routes.signInAdmin}?r=/${language}${route.path}`);
        }
        if (route.dir !== "signIn" && (!authData || !authData.groupData || !authData.groupData.find(i => i.id === "admin" && i.value === true))) {
            return rep.code(302).redirect(languages[0] === language ? "/" : `/${language}`);
        }
        const translationData = routesData.translations.admin.find(i => i.id === route.id);
        const page = route.core ? (await import(`../../pages/${route.dir}/admin/server.marko`)).default : (await import(`../../../../site/pages/${route.dir}/admin/server.marko`)).default;
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
                    authOptions: true,
                    mongoEnabled: true,
                    demo: true,
                    darkModeEnabled: true,
                    passwordPolicy: true,
                    oa2: true,
                },
                oa2: this.systemConfig.oauth2 && Array.isArray(this.systemConfig.oauth2) ? this.systemConfig.oauth2.map(i => ({
                    name: i.name,
                    icon: i.icon,
                    path: i.startRedirectPath,
                    enabled: i.enabled,
                })) : [],
                passwordPolicy: this.systemConfig.passwordPolicy,
                darkModeEnabled: this.systemConfig.darkModeEnabled,
                authOptions: this.systemConfig.auth,
                mongoEnabled: this.systemConfig.mongo.enabled,
                language,
                route: route.id,
                title: translationData.title[language],
                siteTitle: this.siteConfig.title[language],
                i18nNavigation: this.i18nNavigation.admin[language],
                siteId: this.systemConfig.id,
                cookieOptions: this.systemConfig.cookieOptions,
                t: id => languageData[language] && languageData[language][id] ? `${languageData[language][id]}` : id,
                userData: authData ? {
                    id: String(authData._id),
                    username: authData.username,
                } : {},
                systemRoutes: this.systemConfig.routes,
                webSockets: this.systemConfig.webSockets || {},
                demo: this.systemConfig.demo,
            },
        });
        rep.type("text/html");
        rep.send(renderPage.getOutput());
    }
});
