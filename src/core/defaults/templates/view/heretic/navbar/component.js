import Utils from "#lib/componentUtils.js";

export default class {
    async onCreate(input, out) {
        this.state = {
            route: null,
            navOpen: false,
            navItemOpen: null,
            darkMode: false,
        };
        this.siteId = out.global.siteId;
        this.language = out.global.language;
        this.navigation = out.global.navigation;
        this.utils = new Utils(this, this.language);
        await import(/* webpackChunkName: "navbar" */ "./navbar.scss");
    }

    onMount() {
        window.addEventListener("click", (e) => {
            if (
                document.getElementById("hr_navbar_burger") &&
                !document.getElementById("hr_navbar_burger").contains(e.target)
            ) {
                this.setState("navOpen", false);
            }
            if (
                this.state.navItemOpen &&
                document.getElementById(
                    `hr_navbar_item_${this.state.navItemOpen}`,
                ) &&
                !document
                    .getElementById(`hr_navbar_item_${this.state.navItemOpen}`)
                    .contains(e.target)
            ) {
                this.setState("navItemOpen", "");
            }
        });
        this.setRoute();
    }

    getLocalizedURL(url) {
        return this.utils.getLocalizedURL(url);
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

    onBurgerClick(e) {
        e.preventDefault();
        this.setState("navOpen", !this.state.navOpen);
    }

    onNavbarItemClick(e) {
        e.preventDefault();
        const id = e.target.id.replace(/^hr_navbar_item_/, "");
        this.setState("navItemOpen", id);
    }

    async onDarkMode(flag) {
        this.setState("darkMode", flag);
        await this.utils.waitForComponent("hereticLogo");
        this.getComponent("hereticLogo").setDarkMode(flag);
        this.emit("dark-mode", flag);
    }

    onItemTopClick(e) {
        e.preventDefault();
        e.stopPropagation();
    }
}
