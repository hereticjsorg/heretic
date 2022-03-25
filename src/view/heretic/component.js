const cloneDeep = require("lodash.clonedeep");
const i18nLoader = require("../../build/i18n-loader");
const pagesLoader = require("../../build/pages-loader");
const routes = require("../../build/routes.json");

module.exports = class {
    async loadLanguageData() {
        if (process.browser && (!window.__heretic || !window.__heretic.languageData)) {
            window.__heretic = window.__heretic || {};
            if (!window.__heretic.languageData) {
                window.__heretic.languageData = await i18nLoader.loadLanguageFile(this.language);
            }
            window.__heretic.t = id => window.__heretic.languageData[id] || id;
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
        await import(/* webpackChunkName: "bulma" */ "../../../etc/bulma.scss");
        await import(/* webpackChunkName: "heretic" */ "../../heretic.scss");
        await this.loadLanguageData();
    }

    onMount() {
        setTimeout(() => {
            this.setState("mounted", true);
        }, 10);
    }

    getAnimationTimer() {
        return setTimeout(() => this.getComponent("loading").setActive(true), 500);
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
        const component500 = this.getComponent("hr_500");
        if (component500) {
            component500.activatePanicMode();
        }
    }
};
