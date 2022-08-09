const Utils = require("../../core/lib/componentUtils").default;

module.exports = class {
    async onCreate(input, out) {
        this.state = {
            route: null,
            langOpen: false,
            authOpen: false,
            navOpen: false,
            navItemOpen: null,
        };
        this.language = out.global.language;
        this.utils = new Utils(this, this.language);
        await import(/* webpackChunkName: "navbar" */ "./navbar.scss");
    }

    onMount() {
        window.addEventListener("click", e => {
            if (!document.getElementById("hr_navbar_language").contains(e.target)) {
                this.setState("langOpen", false);
            }
            if (!document.getElementById("hr_navbar_burger").contains(e.target)) {
                this.setState("navOpen", false);
            }
            if (!document.getElementById("hr_navbar_auth").contains(e.target)) {
                this.setState("authOpen", false);
            }
            if (this.state.navItemOpen && !document.getElementById(`hr_navbar_item_${this.state.navItemOpen}`).contains(e.target)) {
                this.setState("navItemOpen", "");
            }
        });
        this.setRoute();
    }

    getNonLocalizedURL(url) {
        return this.utils.getNonLocalizedURL(url);
    }

    getLocalizedURL(url) {
        return this.utils.getLocalizedURL(url);
    }

    setRoute(name) {
        this.setState("route", name || (window && window.__heretic && window.__heretic.router && window.__heretic.router.getRoute ? window.__heretic.router.getRoute().id : null));
    }

    onLanguageClick(e) {
        e.preventDefault();
        this.setState("langOpen", !this.state.langOpen);
    }

    onAuthClick(e) {
        e.preventDefault();
        this.setState("authOpen", !this.state.authOpen);
    }

    onBurgerClick(e) {
        e.preventDefault();
        this.setState("navOpen", !this.state.navOpen);
    }

    onNavbarItemClick(e) {
        e.preventDefault();
        const id = e.target.id.replace(/^hr_navbar_item_/, "");
        this.setState("navItemOpen", id);
    }
};
