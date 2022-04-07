import Heretic from "./core/heretic";

(async () => {
    const heretic = new Heretic();
    const fastify = heretic.getFastifyInstance();
    const systemConfig = heretic.getConfigSystem();
    try {
        if (systemConfig.server.static) {
            heretic.serveStaticContent();
        }
        heretic.registerRoutePages();
        heretic.registerRouteErrors();
        heretic.listen();
    } catch (e) {
        fastify.log.error(e.message);
        process.exit(1);
    }
})();
