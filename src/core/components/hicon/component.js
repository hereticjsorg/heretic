import Utils from "#lib/componentUtils";

export default class {
    async onCreate(input, out) {
        this.state = {};
        this.siteId = out.global.siteId;
        if (process.browser) {
            window.__heretic = window.__heretic || {};
            window.__heretic.outGlobal =
                window.__heretic.outGlobal || out.global;
            this.siteId =
                out.global.siteId || window.__heretic.outGlobal.siteId;
        }
        if (input.admin) {
            await import(
                /* webpackChunkName: "hloading-admin" */ "./style-admin.scss"
            );
        } else {
            await import(
                /* webpackChunkName: "hloading-frontend" */ "./style-frontend.scss"
            );
        }
        this.css = input.css;
    }

    async onMount() {
        this.utils = new Utils(this);
    }
}
