const cloneDeep = require("lodash.clonedeep");
const tippy = require("tippy.js").default;
const {
    hideAll,
} = require("tippy.js");
const debounce = require("lodash.debounce");
const Cookies = require("../../../lib/cookiesBrowser").default;
const Utils = require("../../../lib/componentUtils").default;
const i18nLoader = require("../../../../build/loaders/i18n-loader-core");
const pagesLoader = require("../../../../build/loaders/page-loader-admin");
const routesData = require("../../../../build/build.json");

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

    getWebSocket() {
        return new Promise((resolve, reject) => {
            if (!this.userData || !this.userData.id || !this.webSockets || !this.webSockets.enabled) {
                resolve(null);
                return;
            }
            const socket = new WebSocket(this.webSockets.url);
            socket.onopen = () => resolve(socket);
            socket.onerror = e => reject(e);
        });
    }

    setGlobalVariables(out) {
        if (process.browser) {
            window.__heretic = window.__heretic || {};
            window.__heretic.outGlobal = out.global;
        }
    }

    async ping() {
        if (!this.socket) {
            return;
        }
        if (this.socket.readyState === WebSocket.CLOSED || this.socket.readyState === WebSocket.CLOSING) {
            await this.connectWebSocket();
            return;
        }
        this.sendMessage({
            module: "core",
            action: "ping",
        });
    }

    async connectWebSocket() {
        const webSocket = await this.getWebSocket();
        if (webSocket && this.userData.id) {
            this.socket = webSocket;
            window.__heretic.webSocket = webSocket;
            window.__heretic.webSocket.sendMessage = this.sendMessage.bind(this);
            if (!this.socketPingInterval) {
                this.ping();
                this.socketPingInterval = setInterval(() => this.ping(), 30000);
            }
        }
    }

    disconnectWebSocket() {
        if (this.socket && this.socket.readyState !== WebSocket.CLOSED && this.socket.readyState !== WebSocket.CLOSING) {
            this.socket.close();
        }
    }

    sendMessage(message) {
        if (this.socket && this.socket.readyState !== WebSocket.CLOSED && this.socket.readyState !== WebSocket.CLOSING) {
            this.socket.send(JSON.stringify(message));
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
        this.webSockets = out.global.webSockets;
        this.siteId = out.global.siteId;
        this.userData = out.global.userData;
        this.cookieOptions = out.global.cookieOptions;
        await import(/* webpackChunkName: "bulma-admin" */ "./bulma-admin.scss");
        await import(/* webpackChunkName: "heretic-admin" */ "./heretic-admin.scss");
        await this.loadLanguageData();
        this.setGlobalVariables(out);
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

    setTippy() {
        if (this.tippy && this.tippy.length) {
            this.tippy.map(i => i.destroy());
        }
        this.tippy = tippy("[data-tippy-content]");
    }

    async onMount() {
        window.__heretic = window.__heretic || {};
        window.__heretic.setTippy = debounce(this.setTippy, 100);
        window.__heretic.tippyHideAll = hideAll;
        this.utils = new Utils(this);
        await this.utils.waitForLanguageData();
        await this.utils.waitForComponent("menu");
        await this.utils.waitForComponent("navbar");
        window.addEventListener("scroll", this.sideMenuToggle.bind());
        if (!this.userData || !this.userData.id) {
            this.cookies = new Cookies(this.cookieOptions);
            this.cookies.delete(`${this.siteId}.authToken`);
        }
        try {
            await this.connectWebSocket();
        } catch {
            // Ignore
        }
        this.setState("mounted", true);
        window.dispatchEvent(new CustomEvent("scroll"));
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
        const routeData = routesData.routes.admin.find(r => r.id === route.id);
        if ((route.id !== this.serverRoute || this.state.routed) && routeData) {
            const timer = this.getAnimationTimer();
            try {
                component = await pagesLoader.loadComponent(route.id);
                const renderedComponent = await component.default.render();
                this.setState("routed", true);
                await this.utils.waitForElement("hr_content_render_wrap");
                const contentRenderWrap = document.getElementById("hr_content_render_wrap");
                renderedComponent.replaceChildrenOf(contentRenderWrap);
                this.componentsLoaded[route.id] = true;
                this.utils.waitForComponent("navbar");
                const navbarComponent = this.getComponent("navbar");
                navbarComponent.setRoute();
                this.utils.waitForComponent("menu");
                const menuComponent = this.getComponent("menu");
                menuComponent.setRoute();
            } catch (e) {
                this.clearAnimationTimer(timer);
                this.panicMode(e);
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

    onDestroy() {
        if (this.socketPingInterval) {
            clearInterval(this.socketPingInterval);
        }
        this.disconnectWebSocket();
    }
};
