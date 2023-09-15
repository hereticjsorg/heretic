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
            disabled: {
                dirUp: true,
            },
            checked: [],
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

    sortFiles(data, field, direction = "asc") {
        const files = cloneDeep(data).sort((a, b) => {
            if ((a.dir && !b.dir) || (b.dir && !a.dir)) {
                return b.dir ? 1 : -1;
            }
            return direction === "asc" ? ((a[field] > b[field]) ? 1 : ((a[field] < b[field]) ? -1 : 0)) : ((a[field] > b[field]) ? -1 : ((a[field] < b[field]) ? 1 : 0));
        });
        return files;
    }

    async loadData(dir = null) {
        const data = new FormData();
        data.append("formTabs", `{"_default":{"dir":"${dir !== null ? dir : this.state.dir}"}}`);
        data.append("formShared", "{}");
        data.append("tabs", `["_default"]`);
        this.setState("loading", true);
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
            if (this.state.dir !== dir) {
                this.setState("checked", []);
            }
            if (dir !== null) {
                this.setState("dir", dir);
                const disabled = cloneDeep(this.state.disabled);
                disabled.dirUp = !dir.length;
                this.setState("disabled", disabled);
            }
        } catch {
            await this.showNotification("couldNotLoadData", "is-danger");
        } finally {
            this.setState("loading", false);
        }
    }

    onUpdate() {
        if (window.__heretic && window.__heretic.setTippy) {
            window.__heretic.setTippy();
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

    async funcDirUp() {
        if (this.state.dir.length) {
            const dirParts = this.state.dir.split(/\//);
            dirParts.pop();
            await this.loadData(dirParts.join("/"));
        }
    }

    async onTopButtonClick(e) {
        e.preventDefault(e);
        if (!e.target.closest("[data-id]")) {
            return;
        }
        const {
            id,
        } = e.target.closest("[data-id]").dataset;
        if (this.state.disabled[id]) {
            return;
        }
        switch (id) {
        case "dirUp":
            await this.funcDirUp();
            break;
        case "refresh":
            await this.loadData();
            break;
        }
    }

    onCheckboxChange(e) {
        e.preventDefault(e);
        if (!e.target.closest("[data-id]")) {
            return;
        }
        const {
            id,
        } = e.target.closest("[data-id]").dataset;
        const checkbox = document.querySelector(`[data-checkbox-id="${id}"]`);
        const checkedData = checkbox.checked ? cloneDeep([...this.state.checked, id]) : cloneDeep(this.state.checked).filter(i => i !== id);
        this.setState("checked", checkedData);
    }

    onCheckboxAllChange(e) {
        e.preventDefault(e);
        const { checked } = e.target;
        const checkedData = checked ? this.state.files.map(f => f.name) : [];
        this.setState("checked", checkedData);
    }

    updateFilesSort(e) {
        if (!e.target.closest("[data-id]")) {
            return;
        }
        e.preventDefault(e);
        const {
            id,
        } = e.target.closest("[data-id]").dataset;

        const sortDir = (id === this.state.sort) ? (this.state.sortDir === "asc" ? "desc" : "asc") : "asc";
        this.setState("sort", id);
        this.setState("sortDir", sortDir);
        this.setState("files", this.sortFiles(this.state.files, id, sortDir));
    }
}
