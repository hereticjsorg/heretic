const cloneDeep = require("lodash.clonedeep");
const languages = require("../../../etc/languages.json");
const i18nLoader = require("../../../etc/i18n-loader");
const pagesLoader = require("../../../etc/pages-loader");

module.exports = class {
    async loadLanguageData() {
        if (process.browser && (!window.__heretic || !window.__heretic.languageData)) {
            window.__heretic = window.__heretic || {};
            if (!window.__heretic.languageData) {
                window.__heretic.languageData = await i18nLoader.loadLanguageFile(this.language);
            }
            window.__heretic.t = id => window.__heretic.languageData[id] || id;
        }
    }

    navigateToDefault() {
        window.__heretic.router.navigateToDefault();
        window.history.replaceState(null, document.title, window.location.pathname.replace(/#\/(.*)/, ""));
    }

    async onCreate(input, out) {
        this.state = {
            mounted: false,
            routed: false,
            route: {
                name: out.global.route,
                params: {
                    language: out.global.language === Object.keys(languages) ? "" : out.global.language,
                },
            },
            currentComponent: null,
            serverError404: false,
        };
        this.componentsLoaded = {};
        this.language = out.global.language;
        this.serverRouteName = out.global.route;
        await import(/* webpackChunkName: "bulma" */ "../../../etc/bulma.scss");
        await import(/* webpackChunkName: "zoia" */ "../../zoia.scss");
        await this.loadLanguageData();
        if (process.browser) {
            this.navigateToDefault();
        }
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

    async onStateChange(obj) {
        this.setState("route", cloneDeep(obj.route));
        if (this.serverRouteName === "404" && !this.state.serverError404) {
            await this.loadLanguageData();
            obj.route.name = "404";
            obj.previousRoute = true;
            this.setState("serverError404", true);
        }
        if (obj.previousRoute) {
            this.setState("routed", true);
            let component = null;
            const timer = this.getAnimationTimer();
            try {
                component = await pagesLoader.loadComponent(obj.route.name);
                const navbarComponent = this.getComponent("navbar");
                if (navbarComponent) {
                    navbarComponent.setRoute();
                }
            } catch (e) {
                this.clearAnimationTimer(timer);
                return;
            }
            this.clearAnimationTimer(timer);
            this.componentsLoaded[obj.route.name] = true;
            this.setState("currentComponent", component);
        }
    }
};
