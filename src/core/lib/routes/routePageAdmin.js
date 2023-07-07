const languages = Object.keys(require("#etc/languages.json"));
const buildData = require("#build/build.json");

export default (m, page, languageData, language) => ({
    async handler(req, rep) {
        const authData = await req.auth.getData(req.auth.methods.COOKIE);

        if (page.routePath === "/admin/signIn" && authData) {
            return rep.code(302).redirect(languages[0] === language ? this.systemConfig.routes.admin : `/${language}${this.systemConfig.routes.admin}`);
        }
        if (page.routePath !== "/admin/signIn" && !authData) {
            return rep.code(302).redirect(languages[0] === language ? `${this.systemConfig.routes.signInAdmin}?r=${page.routePath}` : `/${language}${this.systemConfig.routes.signInAdmin}?r=/${language}${page.routePath}`);
        }
        if (page.routePath !== "/admin/signIn" && (!authData || !authData.groupData || !authData.groupData.find(i => i.id === "admin" && i.value === true))) {
            return rep.code(302).redirect(languages[0] === language ? "/" : `/${language}`);
        }
        const translationData = buildData.modules.find(i => i.id === m.id).pages.find(i => i.id === page.id).metaData;
        const pageData = (await import(`#src/../${m.path}/${page.id}/server.marko`)).default;
        const renderPage = await pageData.render({
            $global: {
                serializedGlobals: {
                    language: true,
                    page: true,
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
                    route: true,
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
                page: page.id,
                title: translationData.title[language],
                siteTitle: this.siteConfig.title[language],
                i18nNavigation: this.i18nNavigation[language],
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
                route: `${m.id}_${page.id}`,
            },
        });
        rep.type("text/html");
        rep.send(renderPage.getOutput());
    }
});
