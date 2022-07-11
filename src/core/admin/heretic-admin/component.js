const cloneDeep = require("lodash.clonedeep");
const i18nLoader = require("../../../build/i18n-loader-core");
const pagesLoader = require("../../../build/module-admin-loader");
const routes = require("../../../build/routes-admin.json");

module.exports = class {
    async loadLanguageData() {
        if (process.browser && (!window.__heretic || !window.__heretic.languageData)) {
            window.__heretic = window.__heretic || {};
            if (!window.__heretic.languageData) {
                window.__heretic.languageData = await i18nLoader.loadLanguageFile(this.language);
            }
            window.__heretic.t = id => window.__heretic.languageData[id] || id;
            window.__heretic.translationsLoaded = {};
            this.setState("languageLoaded", true);
        }
    }

    async onCreate(input, out) {
        this.state = {
            mounted: false,
            route: null,
            languageLoaded: false,
            routed: false,
            currentComponent: null,
        };
        this.componentsLoaded = {};
        this.language = out.global.language;
        this.serverRoute = out.global.route;
        await import(/* webpackChunkName: "bulma" */ "../../../styles/bulma.scss");
        await import(/* webpackChunkName: "heretic-admin" */ "./heretic-admin.scss");
        await this.loadLanguageData();
    }

    sideMenuToggle() {
        const sideMenu = document.getElementById("hr_side_menu");
        const navbarDummy = document.getElementById("hr_navbar_dummy");
        if (sideMenu && navbarDummy) {
            const menuRect = sideMenu.getBoundingClientRect();
            if ((window.innerHeight || 0) > menuRect.height + 50) {
                const navbarRect = navbarDummy.getBoundingClientRect();
                sideMenu.style.position = navbarRect.top <= 0 ? "fixed" : "unset";
                sideMenu.style.top = navbarRect.top <= 0 ? `${navbarRect.height + 10}px` : "unset";
            }
        }
    }

    onMount() {
        window.addEventListener("scroll", this.sideMenuToggle.bind());
        setTimeout(() => {
            this.setState("mounted", true);
            window.dispatchEvent(new CustomEvent("scroll"));
        }, 50);
    }

    getAnimationTimer() {
        return setTimeout(() => this.getComponent("loading").setActive(true), 499);
    }

    clearAnimationTimer(timer) {
        clearTimeout(timer);
        const loadingComponent = this.getComponent("loading");
        if (loadingComponent) {
            this.getComponent("loading").setActive(false);
        }
    }

    async onRouteChange(router) {
        let component = null;
        const route = router.getRoute();
        const routeData = routes.find(r => r.id === route.id);
        if ((route.id !== this.serverRoute || this.state.routed) && routeData) {
            const timer = this.getAnimationTimer();
            try {
                component = await pagesLoader.loadComponent(route.id);
                const navbarComponent = this.getComponent("navbar");
                if (navbarComponent) {
                    navbarComponent.setRoute();
                }
                const menuComponent = this.getComponent("menu");
                if (menuComponent) {
                    menuComponent.setRoute();
                }
                this.componentsLoaded[route.id] = true;
                this.setState("currentComponent", component);
                this.setState("route", cloneDeep(route));
                this.setState("routed", true);
            } catch (e) {
                this.clearAnimationTimer(timer);
                this.panicMode();
                return;
            }
            this.clearAnimationTimer(timer);
        }
        if (this.state.routed && !routeData) {
            component = await pagesLoader.loadComponent(null);
            this.componentsLoaded["404"] = true;
            this.setState("currentComponent", component);
            this.setState("route", cloneDeep(route));
        }
    }

    panicMode() {
        const componentBrowserError = this.getComponent("hr_browserError");
        if (componentBrowserError) {
            componentBrowserError.activatePanicMode();
        }
    }
};
