import axios from "axios";
import pageConfig from "../page.js";
import Utils from "#lib/componentUtils";
import Cookies from "#lib/cookiesBrowser";
import moduleConfig from "../../module.js";
import Query from "#lib/queryBrowser";

export default class {
    onCreate(input, out) {
        this.state = {
            ready: !process.browser,
            documents: [],
            total: 0,
            pagination: [],
            currentPage: 1,
            totalPages: 0,
            itemsPerPage: 20,
            value: "",
            loading: false,
            firstRun: false,
        };
        this.language = out.global.language;
        this.siteTitle = out.global.siteTitle;
        this.siteId = out.global.siteId;
        this.cookieOptions = out.global.cookieOptions;
        if (process.browser) {
            window.__heretic = window.__heretic || {};
            window.__heretic.outGlobal =
                window.__heretic.outGlobal || out.global || {};
            this.language =
                this.language || window.__heretic.outGlobal.language;
            this.siteTitle =
                out.global.siteTitle || window.__heretic.outGlobal.siteTitle;
            document.title = `${pageConfig.title[this.language]} – ${this.siteTitle}`;
            this.siteId =
                out.global.siteId || window.__heretic.outGlobal.siteId;
            this.cookieOptions =
                out.global.cookieOptions ||
                window.__heretic.outGlobal.cookieOptions;
        }
        this.utils = new Utils(this, this.language);
    }

    getAnimationTimer() {
        return setTimeout(() => this.setState("loading", true), 399);
    }

    async find(value, page = 1) {
        // eslint-disable-next-line no-unused-vars
        const timer = this.getAnimationTimer();
        try {
            const formData = new FormData();
            formData.append("query", value);
            formData.append("language", this.language);
            formData.append("limit", this.state.itemsPerPage);
            formData.append("offset", (page - 1) * this.state.itemsPerPage);
            const { data } = await axios({
                method: "post",
                url: "/api/search",
                data: formData,
                headers: {},
            });
            this.setState("documents", data.documents);
            this.setState("total", data.total);
            this.setState("currentPage", parseInt(page, 10));
            this.setState(
                "totalPages",
                data.total < this.state.itemsPerPage
                    ? 1
                    : Math.ceil(data.total / this.state.itemsPerPage),
            );
            this.generatePagination();
            this.setState("value", value);
            this.query.set(this.queryStringShorthands["query"], value);
            this.query.set(this.queryStringShorthands["currentPage"], page);
            this.setState("firstRun", true);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.log(e);
        }
        clearTimeout(timer);
        this.setState("loading", false);
    }

    async onMount() {
        await this.utils.waitForLanguageData();
        await this.utils.loadLanguageData(moduleConfig.id);
        this.query = new Query();
        this.queryStringShorthands = {
            currentPage: "p",
            query: "q",
        };
        let currentPage = this.query.get(
            this.queryStringShorthands["currentPage"],
        );
        let query = this.query.get(this.queryStringShorthands["query"]);
        this.cookies = new Cookies(this.cookieOptions, this.siteId);
        this.currentToken = this.cookies.get(`${this.siteId}.authToken`);
        this.setState("ready", true);
        // eslint-disable-next-line operator-linebreak
        if (
            currentPage &&
            typeof currentPage === "string" &&
            currentPage.match(/^[0-9]{1,99999}$/) &&
            query &&
            typeof query === "string"
        ) {
            currentPage = parseInt(currentPage, 10);
            query = query.trim();
            if (query) {
                await this.utils.waitForElement("hr_sr_query");
                document.getElementById("hr_sr_query").value = query;
                this.find(query, currentPage);
            }
        }
        setTimeout(async () => {
            await this.utils.waitForElementInViewport("hr_sr_query");
            document.getElementById("hr_sr_query").focus();
        });
    }

    async onFormSubmit(e) {
        e.preventDefault();
        await this.utils.waitForElement("hr_sr_query");
        const value = document.getElementById("hr_sr_query").value.trim();
        if (value) {
            this.find(value);
        }
    }

    generatePagination() {
        const center = [
            this.state.currentPage - 2,
            this.state.currentPage - 1,
            this.state.currentPage,
            this.state.currentPage + 1,
            this.state.currentPage + 2,
        ];
        const filteredCenter = center.filter(
            (p) => p > 1 && p < this.state.totalPages,
        );
        // includeThreeLeft
        if (this.state.currentPage === 5) {
            filteredCenter.unshift(2);
        }
        // includeThreeRight
        if (this.state.currentPage === this.state.totalPages - 4) {
            filteredCenter.push(this.state.totalPages - 1);
        }
        // includeLeftDots
        if (this.state.currentPage > 5) {
            filteredCenter.unshift("...");
        }
        // includeRightDots
        if (this.state.currentPage < this.state.totalPages - 4) {
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

    onPageClick(page) {
        this.find(this.state.value, page);
    }
}
