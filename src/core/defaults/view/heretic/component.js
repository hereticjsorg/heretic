const store = require("store2");
const tippy = require("tippy.js").default;
const {
    hideAll,
} = require("tippy.js");
const debounce = require("lodash.debounce");
const template = require("lodash.template");
const Cookies = require("#lib/cookiesBrowser").default;
const i18nLoader = require("#build/loaders/i18n-loader-core");
const pagesLoader = require("#build/loaders/page-loader-userspace");
const Utils = require("#lib/componentUtils").default;
const routesData = require("#build/build.json");

module.exports = class {
    async loadLanguageData() {
        if (process.browser && (!window.__heretic || !window.__heretic.languageData)) {
            window.__heretic = window.__heretic || {};
            if (!window.__heretic.languageData) {
                window.__heretic.languageData = await i18nLoader.loadLanguageFile(this.language);
                Object.keys(window.__heretic.languageData).map(i => window.__heretic.languageData[i] = typeof window.__heretic.languageData[i] === "string" ? template(window.__heretic.languageData[i]) : window.__heretic.languageData[i]);
            }
            window.__heretic.t = id => window.__heretic.languageData[id] ? typeof window.__heretic.languageData[id] === "function" ? window.__heretic.languageData[id]() : window.__heretic.languageData[id] : id;
            window.__heretic.translationsLoaded = {};
            this.setState("languageLoaded", true);
        }
    }

    setGlobalVariables(out) {
        if (process.browser) {
            window.__heretic = window.__heretic || {};
            window.__heretic.outGlobal = out.global;
        }
    }

    async onCreate(input, out) {
        this.state = {
            mounted: false,
            route: null,
            languageLoaded: false,
            routed: false,
        };
        this.componentsLoaded = {};
        this.language = out.global.language;
        this.serverRoute = out.global.route;
        this.webSockets = out.global.webSockets;
        this.username = out.global.username;
        this.siteId = out.global.siteId;
        this.cookieOptions = out.global.cookieOptions;
        this.utils = new Utils(this, this.language);
        await import(/* webpackChunkName: "bulma" */ "../bulma.scss");
        await import(/* webpackChunkName: "heretic" */ "../heretic.scss");
        await this.loadLanguageData();
        this.setGlobalVariables(out);
    }

    getWebSocket() {
        return new Promise((resolve, reject) => {
            if (!this.username || !this.webSockets || !this.webSockets.enabled) {
                resolve(null);
                return;
            }
            const socket = new WebSocket(this.webSockets.url);
            socket.onopen = () => resolve(socket);
            socket.onerror = e => reject(e);
        });
    }

    disconnectWebSocket() {
        if (this.socket && this.socket.readyState !== WebSocket.CLOSED && this.socket.readyState !== WebSocket.CLOSING) {
            this.socket.close();
        }
    }

    sendMessage(message) {
        if (this.socket && this.socket.readyState !== WebSocket.CLOSED && this.socket.readyState !== WebSocket.CLOSING) {
            try {
                this.socket.send(JSON.stringify(message));
            } catch {
                // Ignore
            }
        }
    }

    setTippy() {
        if (this.tippy && this.tippy.length) {
            this.tippy.map(i => i.destroy());
        }
        this.tippy = tippy("[data-tippy-content]");
    }

    async connectWebSocket() {
        const webSocket = await this.getWebSocket();
        if (webSocket) {
            this.socket = webSocket;
            window.__heretic.webSocket = webSocket;
            window.__heretic.webSocket.sendMessage = this.sendMessage.bind(this);
            if (!this.socketPingInterval) {
                this.ping();
                this.socketPingInterval = setInterval(() => this.ping(), 30000);
            }
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

    async onMount() {
        window.__heretic = window.__heretic || {};
        window.__heretic.setTippy = debounce(this.setTippy, 100);
        window.__heretic.tippyHideAll = hideAll;
        await this.utils.waitForLanguageData();
        try {
            await this.connectWebSocket();
        } catch {
            // Ignore
        }
        this.cookies = new Cookies(this.cookieOptions);
        if (!this.username) {
            this.cookies.delete(`${this.siteId}.authToken`);
        }
        this.store = store.namespace(`heretic_${this.siteId}`);
        const darkMode = this.store.get("darkMode") || false;
        document.documentElement.classList[darkMode ? "add" : "remove"]("heretic-dark");
        document.documentElement.style.transition = "all 0.6s ease";
        this.cookies.set(`${this.siteId}.language`, this.language);
        this.cookies.set(`${this.siteId}.darkMode`, darkMode);
        this.setState("mounted", true);
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
        const routeData = routesData.routes.userspace.find(r => r.id === route.id) || null;
        if (route.id !== this.serverRoute || this.state.routed) {
            const timer = this.getAnimationTimer();
            try {
                document.documentElement.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: "instant",
                });
                component = await pagesLoader.loadComponent(route.id);
                const renderedComponent = await component.default.render();
                this.setState("routed", true);
                await this.utils.waitForElement("hr_content_render_wrap");
                const contentRenderWrap = document.getElementById("hr_content_render_wrap");
                contentRenderWrap.style.display = "none";
                renderedComponent.replaceChildrenOf(contentRenderWrap);
                this.componentsLoaded[route.id] = true;
                await this.utils.waitForComponent("navbar");
                const navbarComponent = this.getComponent("navbar");
                navbarComponent.setRoute();
                contentRenderWrap.style.display = "block";
            } catch (e) {
                this.clearAnimationTimer(timer);
                this.panicMode(e);
                return;
            }
            this.clearAnimationTimer(timer);
        }
        if (this.state.routed && !routeData) {
            const timer = this.getAnimationTimer();
            try {
                component = await pagesLoader.loadComponent();
                const renderedComponent = await component.default.render();
                this.setState("routed", true);
                await this.utils.waitForElement("hr_content_render_wrap");
                const contentRenderWrap = document.getElementById("hr_content_render_wrap");
                renderedComponent.replaceChildrenOf(contentRenderWrap);
                this.componentsLoaded["404"] = true;
                await this.utils.waitForComponent("navbar");
                const navbarComponent = this.getComponent("navbar");
                navbarComponent.setRoute();
            } catch (e) {
                this.clearAnimationTimer(timer);
                this.panicMode(e);
                return;
            }
            this.clearAnimationTimer(timer);
        }
    }

    panicMode(e) {
        if (e) {
            // eslint-disable-next-line no-console
            console.log("Heretic crashed, panic mode activated");
            // eslint-disable-next-line no-console
            console.log(e);
        }
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

    onDarkMode(flag) {
        if (this.cookies) {
            this.cookies.set(`${this.siteId}.darkMode`, flag);
        }
    }
};
