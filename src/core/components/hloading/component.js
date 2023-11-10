import store from "store2";
import Utils from "#lib/componentUtils";

export default class {
    async onCreate(input, out) {
        this.state = {
            isActive: !!input.active,
        };
        this.siteId = out.global.siteId;
        if (process.browser) {
            window.__heretic = window.__heretic || {};
            window.__heretic.outGlobal = window.__heretic.outGlobal || out.global;
            this.siteId = out.global.siteId || window.__heretic.outGlobal.siteId;
        }
        if (input.admin) {
            await import( /* webpackChunkName: "hloading-admin" */ "./style-admin.scss");
        } else {
            await import( /* webpackChunkName: "hloading-frontend" */ "./style-frontend.scss");
        }
        this.utils = new Utils();
    }

    onMount() {
        this.store = store.namespace(`heretic_${this.siteId}`);
        const darkMode = !!this.store.get("darkMode");
        document.documentElement.classList[darkMode ? "add" : "remove"]("heretic-dark");
        if (this.utils) {
            this.utils.setDarkTheme(darkMode);
        }
        document.documentElement.style.transition = "all 0.6s ease";
    }

    setActive(flag) {
        this.setState("isActive", flag);
    }
}
