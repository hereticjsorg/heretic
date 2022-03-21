const createRouter = require("router5").default;
const browserPlugin = require("router5-plugin-browser").default;
// const languagesList = require("../../../etc/languages.json");
// const routes = require("../../../etc/routes.json");

module.exports = class {
    onCreate(input, out) {
        this.routes = input.routes || [];
        this.options = input.options || null;
        this.route = out.global.route;
        this.language = out.global.language;
    }

    onMount() {
        if (!process.browser) {
            return;
        }
        this.router = createRouter(this.routes, this.options);
        this.router.usePlugin(
            browserPlugin({
                useHash: true,
            }),
        );
        this.router.subscribe(obj => {
            this.emit("state-change", obj);
            this.forceUpdate();
        });
        this.router.start();
        window.__heretic = window.__heretic || {};
        window.__heretic.router = this.router;
        window.__heretic.routes = this.routes;
        window.history.replaceState(null, document.title, window.location.pathname.replace(/#\//, ""));
    }
};
