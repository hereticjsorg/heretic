const store = require("store2");

module.exports = class {
    async onCreate(input, out) {
        this.state = {
            isActive: !!input.active,
        };
        this.siteId = out.global.siteId;
        if (process.browser && window.__heretic && window.__heretic.t) {
            this.siteId = out.global.siteId || window.__heretic.outGlobal.siteId;
        }
        if (input.admin) {
            await import(/* webpackChunkName: "hloading-admin" */ "./style-admin.scss");
        } else {
            await import(/* webpackChunkName: "hloading-frontend" */ "./style-frontend.scss");
        }
    }

    onMount() {
        this.store = store.namespace(`heretic_${this.siteId}`);
        const darkMode = !!this.store.get("darkMode");
        document.documentElement.classList[darkMode ? "add" : "remove"]("heretic-dark");
        document.documentElement.style.transition = "all 0.6s ease";
    }

    setActive(flag) {
        this.setState("isActive", flag);
    }
};
