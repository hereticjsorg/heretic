import Heretic from "./core/heretic";

(async () => {
    const heretic = new Heretic();
    try {
        await heretic.loadLanguageData();
        const systemConfig = heretic.getConfigSystem();
        if (systemConfig.server.static) {
            heretic.serveStaticContent();
        }
        heretic.registerRouteModulesFrontend();
        heretic.registerRouteModulesAdmin();
        heretic.registerRouteErrors();
        await heretic.registerRouteAPI();
        heretic.listen();
    } catch (e) {
        heretic.getFastifyInstance().log.error(e.message);
        process.exit(1);
    }
})();
