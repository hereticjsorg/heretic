import axios from "axios";
import Utils from "#lib/componentUtils.js";
import Query from "#lib/queryBrowser.js";
import Cookies from "#lib/cookiesBrowser.js";
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
            itemsPerPage: 30,
            pagination: [],
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
            window.__heretic.outGlobal =
                window.__heretic.outGlobal || out.global || {};
            this.authOptions =
                this.authOptions || window.__heretic.outGlobal.authOptions;
            this.mongoEnabled =
                this.mongoEnabled || window.__heretic.outGlobal.mongoEnabled;
            this.language =
                this.language || window.__heretic.outGlobal.language;
            this.siteTitle =
                out.global.siteTitle || window.__heretic.outGlobal.siteTitle;
            this.siteId =
                out.global.siteId || window.__heretic.outGlobal.siteId;
            this.cookieOptions =
                out.global.cookieOptions ||
                window.__heretic.outGlobal.cookieOptions;
            this.systemRoutes =
                out.global.systemRoutes ||
                window.__heretic.outGlobal.systemRoutes;
            document.title = `${pageConfig.title[this.language]} – ${this.siteTitle}`;
        }
        this.utils = new Utils(this, this.language);
    }

    async setLogWrapWidth() {
        await this.utils.waitForElement("hr_lg_entries_wrap");
        if (!this.setLogWrapWidthRun) {
            if (
                document.getElementById("heretic_dummy").getBoundingClientRect()
                    .width !== document.body.getBoundingClientRect().width
            ) {
                setTimeout(() => this.setLogWrapWidthDelayed());
                return;
            }
            this.setLogWrapWidthRun = true;
        }
        const filesWrap = document.getElementById("hr_lg_entries_wrap");
        filesWrap.style.display = "none";
        await this.utils.waitForElement("hr_lg_dummy");
        const dummy = document.getElementById("hr_lg_dummy");
        const { width } = dummy.getBoundingClientRect();
        filesWrap.style.width = `${width}px`;
        filesWrap.style.display = "block";
    }

    async showNotification(message, css = "is-success") {
        await this.utils.waitForComponent("notify");
        this.getComponent("notify").show(window.__heretic.t(message), css);
    }

    generatePagination() {
        const center = [
            this.state.page - 2,
            this.state.page - 1,
            this.state.page,
            this.state.page + 1,
            this.state.page + 2,
        ];
        const filteredCenter = center.filter(
            (p) => p > 1 && p < this.state.totalPages,
        );
        // includeThreeLeft
        if (this.state.page === 5) {
            filteredCenter.unshift(2);
        }
        // includeThreeRight
        if (this.state.page === this.state.totalPages - 4) {
            filteredCenter.push(this.state.totalPages - 1);
        }
        // includeLeftDots
        if (this.state.page > 5) {
            filteredCenter.unshift("...");
        }
        // includeRightDots
        if (this.state.page < this.state.totalPages - 4) {
            filteredCenter.push("...");
        }
        // Finalize
        const pagination = [1, ...filteredCenter, this.state.totalPages];
        if (pagination.join(",") === "1,1") {
            pagination.pop();
        }
        // Set pagination
        this.setState("pagination", pagination);
    }

    async loadData(
        sort = this.state.sort,
        sortDir = this.state.sortDir,
        page = this.state.page,
    ) {
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
                    fields: ["date", "level", "url", "ip"],
                    sortField: sort,
                    sortDirection: sortDir,
                    itemsPerPage: this.state.itemsPerPage,
                    page: parseInt(page, 10),
                    filters: [],
                    language: this.language,
                },
                headers: this.state.headers,
            });
            this.setState("entries", res.data.items);
            this.setState("sort", sort);
            this.setState("sortDir", sortDir);
            this.setState("page", parseInt(page, 10));
            this.setState(
                "totalPages",
                res.data.total < this.state.itemsPerPage
                    ? 1
                    : Math.ceil(res.data.total / this.state.itemsPerPage),
            );
            this.generatePagination();
            await this.utils.waitForElement("hr_lg_dummy");
            this.setLogWrapWidthDelayed();
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
        await import(/* webpackChunkName: "logs" */ "./logs.scss");
        this.t = window.__heretic.t;
        this.query = new Query();
        this.cookies = new Cookies(this.cookieOptions, this.siteId);
        const currentToken = this.cookies.get(`${this.siteId}.authToken`);
        if (!currentToken) {
            setTimeout(
                () =>
                    (window.location.href = this.utils.getLocalizedURL(
                        this.systemRoutes.signInAdmin,
                    )),
                100,
            );
            return;
        }
        this.setState("headers", {
            Authorization: `Bearer ${currentToken}`,
        });
        this.setState("ready", true);
    }

    onUnauthorized() {
        this.setState("ready", false);
        setTimeout(
            () =>
                (window.location.href = this.utils.getLocalizedURL(
                    this.systemRoutes.signInAdmin,
                )),
            100,
        );
    }

    async onEntryClick(e) {
        if (!e.target.closest("[data-id]")) {
            return;
        }
        e.preventDefault(e);
        const id = parseInt(e.target.closest("[data-id]").dataset.id, 10);
        const item = this.state.entries[id];
        await this.utils.waitForComponent("entryModal");
        this.getComponent("entryModal").show(item);
    }

    async onActionButtonClick(data) {
        switch (data.buttonId) {
            case "view":
                await this.utils.waitForComponent("entryModal");
                this.getComponent("entryModal").show(data.item);
                break;
        }
    }
}
