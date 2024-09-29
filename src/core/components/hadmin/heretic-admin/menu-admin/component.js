module.exports = class {
    async onCreate() {
        this.state = {
            route: null,
        };
        await import(/* webpackChunkName: "menu-admin" */ "./menu-admin.scss");
    }

    setRoute(name) {
        this.setState(
            "route",
            name ||
                (window &&
                window.__heretic &&
                window.__heretic.router &&
                window.__heretic.router.getRoute
                    ? window.__heretic.router.getRoute().id
                    : null),
        );
    }

    async onMount() {
        this.setRoute();
    }
};
