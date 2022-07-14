const Utils = require("../../../componentUtils").default;

module.exports = class {
    async onCreate() {
        const state = {
            route: null,
            langOpen: false,
            navOpen: false,
            navItemOpen: null,
        };
        this.state = state;
        await import(/* webpackChunkName: "navbar-admin" */ "./navbar-admin.scss");
        this.utils = new Utils();
    }

    onMount() {
        window.addEventListener("click", e => {
            if (!document.getElementById("hr_navbar_language").contains(e.target)) {
                this.setState("langOpen", false);
            }
            if (!document.getElementById("hr_navbar_burger").contains(e.target)) {
                this.setState("navOpen", false);
            }
            if (this.state.navItemOpen && !document.getElementById(`hr_navbar_item_${this.state.navItemOpen}`).contains(e.target)) {
                this.setState("navItemOpen", "");
            }
        });
        this.setRoute();
    }

    setRoute(name) {
        this.setState("route", name || (window && window.__heretic && window.__heretic.router && window.__heretic.router.getRoute ? window.__heretic.router.getRoute().id : null));
    }

    onLanguageClick(e) {
        e.preventDefault();
        this.setState("langOpen", !this.state.langOpen);
    }

    onBurgerClick(e) {
        e.preventDefault();
        this.setState("navOpen", !this.state.navOpen);
    }

    getNonLocalizedURL(url) {
        return this.utils.getNonLocalizedURL(url);
    }

    onNavbarItemClick(e) {
        e.preventDefault();
        const id = e.target.id.replace(/^hr_navbar_item_/, "");
        this.setState("navItemOpen", id);
    }
};
