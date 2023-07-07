const Router = require("#lib/router");
const languages = require("#etc/languages.json");
const navigation = require("#etc/navigation.json");
const buildData = require("#build/build.json");

module.exports = class {
    onCreate() {
        const state = {
            route: null,
            language: Object.keys(languages)[0],
        };
        this.state = state;
    }

    onMount() {
        const router = new Router(buildData.routes.userspace, Object.keys(languages), navigation.home);
        router.setOnRouteChangeHandler(this.onRouteChangeHandler.bind(this));
        this.emit("route-change", router);
        window.__heretic = window.__heretic || {};
        window.__heretic.router = router;
    }

    onRouteChangeHandler(router) {
        if (window.__heretic && window.__heretic.tippyHideAll) {
            window.__heretic.tippyHideAll();
        }
        this.emit("route-change", router);
    }
};
