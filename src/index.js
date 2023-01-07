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
        if (systemConfig.mongo.enabled) {
            const installedVersion = await heretic.installedDbVersion();
            if (!installedVersion || heretic.getOptions().setup) {
                await heretic.setup();
            }
            if (heretic.getOptions().setup) {
                heretic.disconnectDatabase();
                heretic.getFastifyInstance().log.info("Setup complete.");
                process.exit(1);
            }
        }
        await heretic.initDataProviders();
        heretic.registerRoutePagesUserspace();
        heretic.registerRoutePagesAdmin();
        heretic.registerRoutePagesCore();
        heretic.registerRouteErrors();
        await heretic.registerRouteAPI();
        await heretic.registerRouteWebSockets();
        heretic.listen();
    } catch (e) {
        heretic.getFastifyInstance().log.error(e.message);
        process.exit(1);
    }
})();
