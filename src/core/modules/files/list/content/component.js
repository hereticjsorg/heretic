import axios from "axios";
import cloneDeep from "lodash.clonedeep";
import debounce from "lodash.debounce";
import throttle from "lodash.throttle";
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
                cut: true,
                copy: true,
                delete: true,
                paste: true,
            },
            checked: [],
            actionMenu: null,
            mobile: false,
            init: false,
            loading: false,
            clipboard: null,
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
        if (this.state.loading) {
            return;
        }
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
            const disabled = cloneDeep(this.state.disabled);
            disabled.copy = true;
            disabled.cut = true;
            disabled.delete = true;
            if (dir !== null) {
                this.setState("dir", dir);
                disabled.dirUp = !dir.length;
            }
            disabled.paste = !this.state.clipboard || this.state.clipboard.src === this.state.dir;
            this.setState("disabled", disabled);
            await this.utils.waitForElement("hr_fs_dummy");
            this.setFilesWrapWidthDelayed();
        } catch (er) {
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

    async setFilesWrapWidth() {
        await this.utils.waitForElement("hr_fs_files_wrap");
        if (!this.setFilesWrapWidthRun) {
            if (document.getElementById("hr_admin_dummy").getBoundingClientRect().width !== document.body.getBoundingClientRect().width) {
                setTimeout(() => this.setFilesWrapWidthDelayed());
                return;
            }
            this.setFilesWrapWidthRun = true;
        }
        const filesWrap = document.getElementById("hr_fs_files_wrap");
        filesWrap.style.display = "none";
        await this.utils.waitForElement("hr_fs_dummy");
        const dummy = document.getElementById("hr_fs_dummy");
        const {
            width,
        } = dummy.getBoundingClientRect();
        filesWrap.style.width = `${width}px`;
        filesWrap.style.display = "block";
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
        window.addEventListener("click", e => {
            if (!e.target.closest("[data-dropdown]")) {
                this.setState("actionMenu", null);
            }
        });
        this.setFilesWrapWidthDelayed = throttle(this.setFilesWrapWidth, 200);
        window.addEventListener("resize", debounce(() => this.setState("mobile", window.innerWidth < 769), 500));
        window.addEventListener("resize", () => this.setFilesWrapWidth());
        this.setState("mobile", window.innerWidth < 769);
        await this.loadData();
    }

    async onFileClick(e) {
        if (e.target.closest("[data-checkboxid]")) {
            e.preventDefault(e);
            const {
                checkboxid,
            } = e.target.closest("[data-checkboxid]").dataset;
            const checkbox = document.querySelector(`[data-checkboxid="${checkboxid}"]`);
            const checkedData = checkbox.checked ? cloneDeep([...this.state.checked, checkboxid]) : cloneDeep(this.state.checked).filter(i => i !== checkboxid);
            this.setState("checked", checkedData);
            const disabled = cloneDeep(this.state.disabled);
            disabled.copy = !checkedData.length;
            disabled.cut = !checkedData.length;
            disabled.delete = !checkedData.length;
            this.setState("disabled", disabled);
            return;
        }
        if (e.target.closest("[data-dropdown]")) {
            e.preventDefault();
            const {
                dropdown,
            } = e.target.closest("[data-dropdown]").dataset;
            this.setState("actionMenu", this.state.actionMenu === dropdown ? null : dropdown);
            return;
        }
        if (e.target.closest("[data-click]")) {
            e.preventDefault();
            const {
                id,
            } = e.target.closest("[data-id]").dataset;
            const file = this.state.files.find(f => f.name === id);
            if (file.dir) {
                await this.loadData(`${this.state.dir}/${file.name}`);
            }
            return;
        }
        if (e.target.closest("[data-id]")) {
            e.preventDefault();
            const {
                id,
            } = e.target.closest("[data-id]").dataset;
            const {
                filename,
            } = e.target.closest("[data-filename]").dataset;
            const disabled = cloneDeep(this.state.disabled);
            switch (id) {
            case "rename":
                await this.utils.waitForComponent("nameModal");
                this.getComponent("nameModal").show(`${window.__heretic.t("rename")}: ${filename}`, filename, id);
                break;
            case "cut":
            case "copy":
                this.setState("clipboard", {
                    mode: id,
                    files: [filename],
                    src: this.state.dir,
                });
                await this.showNotification("addedToClipboard", "is-info");
                disabled.paste = true;
                break;
            }
            this.setState("disabled", disabled);
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
        case "newDir":
            await this.utils.waitForComponent("nameModal");
            this.getComponent("nameModal").show(window.__heretic.t("newDir"), "", "newDir");
            break;
        case "copy":
        case "cut":
            this.setState("clipboard", {
                mode: id,
                files: cloneDeep(this.state.checked),
                src: this.state.dir,
            });
            await this.showNotification("addedToClipboard", "is-success");
            const disabledCutCopy = cloneDeep(this.state.disabled);
            disabledCutCopy.paste = true;
            this.setState("disabled", disabledCutCopy);
            break;
        case "upload":
            await this.utils.waitForComponent("uploadModal");
            this.getComponent("uploadModal").show(this.state.dir);
            break;
        case "paste":
            if (!this.state.clipboard || !this.state.clipboard.files.length) {
                return;
            }
            this.setState("loading", true);
            const formTabs = JSON.stringify({
                _default: {
                    srcDir: this.state.clipboard.src,
                    destDir: this.state.dir,
                    action: this.state.clipboard.mode,
                    files: this.state.clipboard.files,
                },
            });
            const data = new FormData();
            data.append("formTabs", formTabs);
            data.append("formShared", "{}");
            data.append("tabs", `["_default"]`);
            try {
                await axios({
                    method: "post",
                    url: "/api/files/process",
                    data,
                    headers: {
                        Authorization: `Bearer ${this.currentToken}`,
                    },
                });
                this.setState("clipboard", null);
                const disabledPaste = cloneDeep(this.state.disabled);
                disabledPaste.paste = true;
                this.setState("disabled", disabledPaste);
            } catch (er) {
                await this.showNotification("couldNotLoadData", "is-danger");
            } finally {
                this.setState("loading", false);
            }
            break;
        }
    }

    onCheckboxAllChange(e) {
        e.preventDefault(e);
        const {
            checked
        } = e.target;
        const checkedData = checked ? this.state.files.map(f => f.name) : [];
        this.setState("checked", checkedData);
        const disabled = cloneDeep(this.state.disabled);
        disabled.copy = !checkedData.length;
        disabled.cut = !checkedData.length;
        disabled.delete = !checkedData.length;
        this.setState("disabled", disabled);
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

    // eslint-disable-next-line no-unused-vars
    onNameModalData(data) {
        // Ignore
    }

    onUploadDone() {
        this.loadData();
    }

    onBreadcrumbClick(e) {
        if (!e.target.closest("[data-path]")) {
            return;
        }
        const {
            path,
        } = e.target.closest("[data-path]").dataset;
        this.loadData(path);
    }

    onDropClipboard(e) {
        e.preventDefault();
        this.setState("clipboard", null);
        const disabled = cloneDeep(this.state.disabled);
        disabled.paste = true;
        this.setState("disabled", disabled);
    }
}
