const store = require("store2");
const Utils = require("../../../../lib/componentUtils").default;

module.exports = class {
    async onCreate(input, out) {
        const state = {
            route: null,
            langOpen: false,
            authOpen: false,
            navOpen: false,
            navItemOpen: null,
            darkMode: false,
        };
        this.siteId = out.global.siteId;
        this.state = state;
        await import(/* webpackChunkName: "navbar-admin" */ "./navbar-admin.scss");
        this.utils = new Utils();
    }

    onMount() {
        window.addEventListener("click", e => {
            if (document.getElementById("hr_navbar_language") && !document.getElementById("hr_navbar_language").contains(e.target)) {
                this.setState("langOpen", false);
            }
            if (document.getElementById("hr_navbar_auth") && !document.getElementById("hr_navbar_auth").contains(e.target)) {
                this.setState("authOpen", false);
            }
            if (document.getElementById("hr_navbar_burger") && !document.getElementById("hr_navbar_burger").contains(e.target)) {
                this.setState("navOpen", false);
            }
            if (this.state.navItemOpen && document.getElementById(`hr_navbar_item_${this.state.navItemOpen}`) && !document.getElementById(`hr_navbar_item_${this.state.navItemOpen}`).contains(e.target)) {
                this.setState("navItemOpen", "");
            }
        });
        this.store = store.namespace(`heretic_${this.siteId}`);
        const darkMode = !!this.store.get("darkMode");
        this.setState("darkMode", darkMode);
        this.setRoute();
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
        this.setState("authOpen", !this.state.langOpen);
    }

    onBurgerClick(e) {
        e.preventDefault();
        this.setState("navOpen", !this.state.navOpen);
    }

    getNonLocalizedURL(url) {
        this.utils = this.utils || new Utils();
        return this.utils.getNonLocalizedURL(url);
    }

    onNavbarItemClick(e) {
        e.preventDefault();
        const id = e.target.id.replace(/^hr_navbar_item_/, "");
        this.setState("navItemOpen", id);
    }

    onDarkModeSwitchClick(e) {
        e.preventDefault();
        const darkMode = !this.state.darkMode;
        this.store.set("darkMode", darkMode);
        this.setState("darkMode", darkMode);
        this.emit("dark-mode", darkMode);
        document.documentElement.classList[darkMode ? "add" : "remove"]("heretic-dark");
    }
};
