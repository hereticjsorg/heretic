import store from "store2";
import tippy, {
    hideAll,
} from "tippy.js";
import debounce from "lodash/debounce";
import template from "lodash/template";
import axios from "axios";
import Cookies from "#lib/cookiesBrowser";
import i18nLoader from "#build/loaders/i18n-loader-core";
import pagesLoader from "#build/loaders/page-loader-userspace";
import Utils from "#lib/componentUtils";
import routesData from "#build/build.json";
import contentPage from "#site/contentRender/index.marko";

export default class {
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
            contentData: out.global.contentData || null,
        };
        this.componentsLoaded = {};
        this.language = out.global.language;
        this.serverRoute = out.global.route;
        this.webSockets = out.global.webSockets;
        this.username = out.global.username;
        this.siteId = out.global.siteId;
        this.cookieOptions = out.global.cookieOptions;
        this.utils = new Utils(this, this.language);
        await import( /* webpackChunkName: "bulma" */ "../bulma.scss");
        await import( /* webpackChunkName: "heretic" */ "../heretic.scss");
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

    interceptClickEvent(e) {
        const target = e.target || e.srcElement;
        if (!window.__heretic.routingStop && target.tagName === "A") {
            let url = target.getAttribute("href");
            if (!target.getAttribute("route") && url && url.match(/^\//)) {
                e.preventDefault();
                const re = new RegExp(`^\\/${this.language}`, "gm");
                url = url.replace(re, "");
                window.__heretic.router.navigate(url, this.language);
            }
        }
    }

    async onMount() {
        window.__heretic = window.__heretic || {};
        window.__heretic.setTippy = debounce(this.setTippy, 100);
        window.__heretic.tippyHideAll = hideAll;
        await this.loadLanguageData();
        await this.utils.waitForLanguageData();
        try {
            await this.connectWebSocket();
        } catch {
            // Ignore
        }
        this.cookies = new Cookies(this.cookieOptions, this.siteId);
        if (!this.username) {
            this.cookies.delete(`${this.siteId}.authToken`);
        }
        this.store = store.namespace(`heretic_${this.siteId}`);
        const darkMode = this.store.get("darkMode") || false;
        document.documentElement.classList[darkMode ? "add" : "remove"]("theme-dark");
        document.documentElement.classList[!darkMode ? "add" : "remove"]("theme-light");
        this.utils.setDarkTheme(darkMode);
        document.documentElement.style.transition = "all 0.6s ease";
        this.cookies.set(`${this.siteId}.language`, this.language);
        this.cookies.set(`${this.siteId}.darkMode`, darkMode);
        this.setState("mounted", true);
        const hereticContentWidth = document.getElementById("heretic_content").clientWidth;
        const hereticContentInterval = setInterval(async () => {
            if (document.getElementById("heretic_dummy").clientWidth !== hereticContentWidth && document.getElementById("heretic_content").clientWidth > hereticContentWidth) {
                clearInterval(hereticContentInterval);
                window.__heretic.viewSettled = true;
            }
        }, 10);
        document.addEventListener("click", this.interceptClickEvent.bind(this));
        window.addEventListener("hrpanicmode", this.panicMode.bind(this));
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
        window.__heretic = window.__heretic || {};
        let component = null;
        const route = router.getRoute();
        const routeData = routesData.routes.userspace.find(r => r.id === route.id) || null;
        await this.utils.waitForComponent("navbar");
        const navbarComponent = this.getComponent("navbar");
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
                navbarComponent.setRoute();
                contentRenderWrap.style.display = "block";
            } catch (e) {
                this.clearAnimationTimer(timer);
                this.panicMode(e);
                return;
            }
            this.clearAnimationTimer(timer);
        }
        if (this.state.routed && (!routeData || !routeData.id)) {
            await this.utils.waitForLanguageData();
            const timer = this.getAnimationTimer();
            const contentRenderWrap = document.getElementById("hr_content_render_wrap");
            contentRenderWrap.innerHTML = "";
            try {
                if (router.getLocationData().path === this.serverRoute && this.state.contentData) {
                    window.__heretic.contentData = this.state.contentData;
                    this.setState("contentData", null);
                } else {
                    try {
                        const {
                            data
                        } = await axios({
                            method: "post",
                            url: "/api/content",
                            data: {
                                url: router.getLocationData().path,
                                language: this.language,
                            },
                            headers: {},
                        });
                        window.__heretic.contentData = data;
                        navbarComponent.setRoute(router.getLocationData().path);
                    } catch {
                        window.__heretic.contentData = null;
                    }
                }
                await this.utils.waitForElement("hr_content_render_wrap");
                if (window.__heretic.contentData) {
                    const renderedComponent = await contentPage.render();
                    renderedComponent.replaceChildrenOf(contentRenderWrap);
                } else {
                    try {
                        const {
                            pathname
                        } = new URL(window.location.href.replace(window.location.search, ""));
                        await axios({
                            method: "get",
                            url: pathname,
                            headers: {},
                        });
                        window.location.href = pathname;
                        return;
                    } catch {
                        // Ignore
                    }
                    component = await pagesLoader.loadComponent();
                    const renderedComponent = await component.default.render();
                    renderedComponent.replaceChildrenOf(contentRenderWrap);
                    this.componentsLoaded["404"] = true;
                    await this.utils.waitForComponent("navbar");
                    navbarComponent.setRoute(router.getLocationData().path);
                }
                this.setState("routed", true);
                this.clearAnimationTimer(timer);
            } catch (e) {
                this.clearAnimationTimer(timer);
                this.panicMode(e);
            }
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
}
