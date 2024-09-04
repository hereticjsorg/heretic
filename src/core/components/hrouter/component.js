import Router from "#lib/router.js";
import languages from "#etc/languages.json";
import navigation from "#etc/navigation.json";
import buildData from "#build/build.json";

export default class {
    onCreate() {
        const state = {
            route: null,
            language: Object.keys(languages)[0],
        };
        this.state = state;
    }

    onMount() {
        const router = new Router(
            buildData.routes.userspace,
            Object.keys(languages),
            navigation.home,
        );
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
}
