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
        await heretic.initDataProviders();
        heretic.registerRoutePagesUserspace();
        heretic.registerRoutePagesAdmin();
        heretic.registerRoutePagesCore();
        heretic.registerRouteErrors();
        await heretic.registerRouteAPI();
        await heretic.registerRouteWS();
        heretic.listen();
    } catch (e) {
        heretic.getFastifyInstance().log.error(e.message);
        process.exit(1);
    }
})();
