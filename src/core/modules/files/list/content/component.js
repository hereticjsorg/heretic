import axios from "axios";
import cloneDeep from "lodash.clonedeep";
import Utils from "#lib/componentUtils";
import Cookies from "#lib/cookiesBrowser";
import pageConfig from "../page.js";
import moduleConfig from "../../module.js";

export default class {
    onCreate(input, out) {
        this.state = {
            ready: !process.browser,
            info: null,
            failed: false,
            dir: "",
            sort: "name",
            sortDir: "asc",
            files: [],
        };
        this.language = out.global.language;
        this.siteTitle = out.global.siteTitle;
        this.siteId = out.global.siteId;
        this.cookieOptions = out.global.cookieOptions;
        this.systemRoutes = out.global.systemRoutes;
        this.webSockets = out.global.webSockets;
        this.authOptions = out.global.authOptions;
        this.mongoEnabled = out.global.mongoEnabled;
        if (process.browser) {
            window.__heretic = window.__heretic || {};
            window.__heretic.outGlobal = window.__heretic.outGlobal || out.global || {};
            this.authOptions = this.authOptions || window.__heretic.outGlobal.authOptions;
            this.mongoEnabled = this.mongoEnabled || window.__heretic.outGlobal.mongoEnabled;
            this.language = this.language || window.__heretic.outGlobal.language;
            this.siteTitle = out.global.siteTitle || window.__heretic.outGlobal.siteTitle;
            document.title = `${pageConfig.title[this.language]} – ${this.siteTitle}`;
            this.siteId = out.global.siteId || window.__heretic.outGlobal.siteId;
            this.cookieOptions = out.global.cookieOptions || window.__heretic.outGlobal.cookieOptions;
            this.systemRoutes = out.global.systemRoutes || window.__heretic.outGlobal.systemRoutes;
            this.webSockets = out.global.webSockets || window.__heretic.outGlobal.webSockets;
        }
        this.utils = new Utils(this, this.language);
    }

    async showNotification(message, css = "is-success") {
        await this.utils.waitForComponent("notify");
        this.getComponent("notify").show(window.__heretic.t(message), css);
    }

    sortFiles(data, field, dir = "asc") {
        const files = cloneDeep(data).sort((a, b) => {
            if ((a.dir && !b.dir) || (b.dir && !a.dir)) {
                return b.dir ? 1 : -1;
            }
            return dir === "asc" ? a[field] - b[field] : b[field] - a[field];
        });
        return files;
    }

    async loadData(dir) {
        const data = new FormData();
        data.append("formTabs", `{"_default":{"dir":"${dir || this.state.dir}"}}`);
        data.append("formShared", "{}");
        data.append("tabs", `["_default"]`);
        try {
            const res = await axios({
                method: "post",
                url: "/api/files/list",
                data,
                headers: {
                    Authorization: `Bearer ${this.currentToken}`,
                },
            });
            this.setState("files", this.sortFiles(res.data.files, "name"));
            if (dir) {
                this.setState("dir", dir);
            }
        } catch (e) {
            // eslint-disable-next-line no-console
            console.log(e);
            await this.showNotification("couldNotLoadData", "is-danger");
        }
    }

    async onMount() {
        await this.utils.waitForLanguageData();
        await this.utils.loadLanguageData(moduleConfig.id);
        this.cookies = new Cookies(this.cookieOptions);
        this.currentToken = this.cookies.get(`${this.siteId}.authToken`);
        if (!this.currentToken) {
            setTimeout(() => window.location.href = `${this.utils.getLocalizedURL(this.systemRoutes.signInAdmin)}`, 100);
            return;
        }
        this.setState("ready", true);
        this.loadData();
    }

    async onFileClick(e) {
        if (!e.target.closest("[data-click]")) {
            return;
        }
        e.preventDefault();
        const {
            id,
        } = e.target.closest("[data-id]").dataset;
        const file = this.state.files.find(f => f.name === id);
        if (file.dir) {
            await this.loadData(`${this.state.dir}/${file.name}`);
        }
    }
}
