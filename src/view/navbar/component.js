const languagesList = require("../../config/languages.json");

module.exports = class {
    async onCreate() {
        const state = {
            route: null,
            langOpen: false,
            navOpen: false,
        };
        this.state = state;
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
        const languages = Object.keys(languagesList);
        const data = {};
        const urlParts = url.split(/\//);
        if (urlParts.length > 1) {
            const firstPartOfURL = urlParts[1];
            if (languages.indexOf(firstPartOfURL) > -1) {
                [data.language] = urlParts.splice(1, 1);
            } else {
                [data.language] = languages;
            }
            data.url = urlParts.join("/") || "/";
            data.url = data.url.length > 1 ? data.url.replace(/\/$/, "") : data.url;
        }
        return data;
    }
};
