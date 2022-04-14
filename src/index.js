import Heretic from "./core/heretic";

(async () => {
    const heretic = new Heretic();
    const systemConfig = heretic.getConfigSystem();
    try {
        if (systemConfig.server.static) {
            heretic.serveStaticContent();
        }
        heretic.registerRoutePages();
        heretic.registerRouteErrors();
        await heretic.registerRouteAPI();
        heretic.listen();
    } catch (e) {
        heretic.getFastifyInstance().log.error(e.message);
        process.exit(1);
    }
})();
