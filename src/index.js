import Heretic from "./core/lib/heretic";

(async () => {
    const heretic = new Heretic();
    try {
        await heretic.loadLanguageData();
        const systemConfig = heretic.getConfigSystem();
        if (systemConfig.server.static) {
            heretic.serveStaticContent();
        }
        await heretic.connectDatabase();
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
