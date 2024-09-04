import cloneDeep from "lodash/cloneDeep";
import axios from "axios";
import { v4 as uuid } from "uuid";
import Cookies from "#lib/cookiesBrowser.js";
import Utils from "#lib/componentUtils.js";

export default class {
    onCreate(input, out) {
        this.state = {
            ready: false,
            active: false,
            dir: "",
            value: [],
            uploading: false,
            uploadProgress: 0,
            error: false,
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
            this.siteId =
                out.global.siteId || window.__heretic.outGlobal.siteId;
            this.cookieOptions =
                out.global.cookieOptions ||
                window.__heretic.outGlobal.cookieOptions;
        }
        this.utils = new Utils(this, this.language);
    }

    async showNotification(message, css = "is-success") {
        this.emit("notification", {
            message,
            css,
        });
    }

    async onMount() {
        this.cookies = new Cookies(this.cookieOptions, this.siteId);
        this.currentToken = this.cookies.get(`${this.siteId}.authToken`);
        this.setState("ready", true);
        window.addEventListener("keydown", this.onKeyDown.bind(this));
    }

    async show(dir) {
        this.setState("value", []);
        this.setState("uploading", false);
        this.setState("dir", dir);
        this.setState("active", true);
    }

    onKeyDown(e) {
        if (e.key === "Escape" && this.state.active) {
            e.preventDefault();
            e.stopPropagation();
            this.hide();
        }
    }

    hide() {
        if (!this.state.uploading) {
            this.setState("active", false);
        }
    }

    async onFileInputChange(e) {
        const value = cloneDeep(this.state.value);
        const files = Array.from(e.target.files);
        for (let i = 0; i < files.length; i += 1) {
            if (value.find((f) => f.name === files[i].name)) {
                await this.showNotification(
                    `${window.__heretic.t("duplicateFilename")} (${files[i].name})`,
                    "is-warning",
                );
                continue;
            }
            value.push({
                name: files[i].name,
                uid: uuid(),
                data: e.target.files[i],
            });
        }
        this.setState("value", value);
    }

    onFileInputDeleteClick(e) {
        e.preventDefault();
        const { uid } = e.target.closest("[data-uid]").dataset;
        const value = cloneDeep(this.state.value).filter((f) => f.uid !== uid);
        this.setState("value", value);
    }

    async onSubmit(e) {
        e.preventDefault();
        this.setState("uploadProgress", 0);
        this.setState("uploading", true);
        try {
            const data = new FormData();
            data.append("dir", this.state.dir);
            for (const f of this.state.value) {
                data.append(f.name, f.data);
            }
            await axios({
                method: "post",
                url: `/api/files/upload`,
                data,
                headers: {
                    Authorization: `Bearer ${this.currentToken}`,
                },
                onUploadProgress: (progressEvent) => {
                    const { loaded, total } = progressEvent;
                    const percentage = Math.floor((loaded * 100) / total);
                    this.setState("uploadProgress", percentage);
                },
            });
            await this.showNotification("uploadSuccess", "is-success");
        } catch {
            await this.showNotification("couldNotUpload", "is-danger");
        } finally {
            this.setState("uploading", false);
            this.hide();
            this.emit("done");
        }
    }
}
