const Router = require("../../lib/router");
const languages = require("../../../../etc/languages.json");
const routesData = require("../../../build/build.json");

module.exports = class {
    onCreate() {
        const state = {
            route: null,
            language: Object.keys(languages)[0],
        };
        this.state = state;
    }

    onMount() {
        const router = new Router(routesData.routes.admin, Object.keys(languages));
        router.setOnRouteChangeHandler(this.onRouteChangeHandler.bind(this));
        this.emit("route-change", router);
        window.__heretic = window.__heretic || {};
        window.__heretic.router = router;
    }

    onRouteChangeHandler(router) {
        this.emit("route-change", router);
    }
};
