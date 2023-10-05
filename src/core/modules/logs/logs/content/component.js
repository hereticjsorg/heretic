// import cloneDeep from "lodash.clonedeep";
import axios from "axios";
import throttle from "lodash.throttle";
import debounce from "lodash.debounce";
import Utils from "#lib/componentUtils";
import Query from "#lib/queryBrowser";
import Cookies from "#lib/cookiesBrowser";
import moduleConfig from "../../module.js";
import pageConfig from "../page.js";

export default class {
    onCreate(input, out) {
        this.state = {
            ready: !process.browser,
            headers: null,
            failed: false,
            entries: [],
            loading: false,
            sort: "date",
            sortDir: "desc",
            page: 1,
            mobile: false,
        };
        this.language = out.global.language;
        this.siteTitle = out.global.siteTitle;
        this.siteId = out.global.siteId;
        this.cookieOptions = out.global.cookieOptions;
        this.systemRoutes = out.global.systemRoutes;
        this.authOptions = out.global.authOptions;
        this.mongoEnabled = out.global.mongoEnabled;
        if (process.browser) {
            window.__heretic = window.__heretic || {};
            window.__heretic.outGlobal = window.__heretic.outGlobal || out.global || {};
            this.authOptions = this.authOptions || window.__heretic.outGlobal.authOptions;
            this.mongoEnabled = this.mongoEnabled || window.__heretic.outGlobal.mongoEnabled;
            this.language = this.language || window.__heretic.outGlobal.language;
            this.siteTitle = out.global.siteTitle || window.__heretic.outGlobal.siteTitle;
            this.siteId = out.global.siteId || window.__heretic.outGlobal.siteId;
            this.cookieOptions = out.global.cookieOptions || window.__heretic.outGlobal.cookieOptions;
            this.systemRoutes = out.global.systemRoutes || window.__heretic.outGlobal.systemRoutes;
            document.title = `${pageConfig.title[this.language]} – ${this.siteTitle}`;
        }
        this.utils = new Utils(this, this.language);
    }

    async setLogWrapWidth() {
        await this.utils.waitForElement("hr_fs_entries_wrap");
        if (!this.setLogWrapWidthRun) {
            if (document.getElementById("hr_admin_dummy").getBoundingClientRect().width !== document.body.getBoundingClientRect().width) {
                setTimeout(() => this.setLogWrapWidthDelayed());
                return;
            }
            this.setLogWrapWidthRun = true;
        }
        const filesWrap = document.getElementById("hr_fs_entries_wrap");
        filesWrap.style.display = "none";
        await this.utils.waitForElement("hr_lg_dummy");
        const dummy = document.getElementById("hr_lg_dummy");
        const {
            width,
        } = dummy.getBoundingClientRect();
        filesWrap.style.width = `${width}px`;
        filesWrap.style.display = "block";
    }

    async showNotification(message, css = "is-success") {
        await this.utils.waitForComponent("notify");
        this.getComponent("notify").show(window.__heretic.t(message), css);
    }

    async loadData() {
        if (this.state.loading) {
            return;
        }
        this.setState("loading", true);
        try {
            const res = await axios({
                method: "post",
                url: "/api/logs/list",
                data: {
                    searchText: "",
                    fields: ["date", "level", "url"],
                    sortField: this.state.sort,
                    sortDirection: this.state.sortDir,
                    itemsPerPage: 30,
                    page: this.state.page,
                    filters: [],
                    language: this.language,
                },
                headers: this.state.headers,
            });
            this.setState("entries", res.data.items);
            // await this.utils.waitForElement("hr_fs_dummy");
            // this.setLogWrapWidthDelayed();
        } catch (er) {
            await this.showNotification("couldNotLoadData", "is-danger");
        } finally {
            this.setState("loading", false);
        }
    }

    async onMount() {
        await this.utils.waitForLanguageData();
        await this.utils.loadLanguageData(moduleConfig.id);
        if (!this.mongoEnabled) {
            return;
        }
        this.t = window.__heretic.t;
        this.query = new Query();
        this.cookies = new Cookies(this.cookieOptions);
        const currentToken = this.cookies.get(`${this.siteId}.authToken`);
        if (!currentToken) {
            setTimeout(() => window.location.href = this.utils.getLocalizedURL(this.systemRoutes.signInAdmin), 100);
            return;
        }
        this.setState("headers", {
            Authorization: `Bearer ${currentToken}`
        });
        this.setLogWrapWidthDelayed = throttle(this.setLogWrapWidth, 200);
        this.setState("mobile", window.innerWidth <= 768);
        window.addEventListener("resize", debounce(() => this.setState("mobile", window.innerWidth <= 768), 500));
        if (window.innerWidth > 768) {
            window.addEventListener("resize", () => this.setLogWrapWidth());
        }
        this.setState("ready", true);
        await this.loadData();
    }

    onUnauthorized() {
        this.setState("ready", false);
        setTimeout(() => window.location.href = this.utils.getLocalizedURL(this.systemRoutes.signInAdmin), 100);
    }

    updateSort() {}

    onEntryClick() {}
}
