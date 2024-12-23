import Heretic from "./core/lib/heretic.js";

(async () => {
    const heretic = new Heretic();
    try {
        await heretic.initRedis();
        await heretic.initRateLimit();
        await heretic.loadLanguageData();
        const systemConfig = heretic.getConfigSystem();
        if (systemConfig.server.static) {
            heretic.serveStaticContent();
        }
        await heretic.connectDatabase();
        if (systemConfig.mongo.enabled) {
            const installedVersions = await heretic.installedDbVersions();
            await heretic.setup(installedVersions, heretic.getOptions());
            if (heretic.getOptions().setup) {
                heretic.disconnectDatabase();
                heretic.getFastifyInstance().log.info("Setup complete.");
                process.exit(1);
            }
        }
        await heretic.initDataProviders();
        heretic.registerModules();
        heretic.registerRouteErrors();
        await heretic.registerRouteAPI();
        await heretic.registerRouteWebSockets();
        await heretic.registerOauth2();
        if (heretic.getOptions().index) {
            await heretic.index();
            process.exit(0);
        }
        heretic.listen();
    } catch (e) {
        heretic.getFastifyInstance().log.error(e);
        process.exit(1);
    }
})();
