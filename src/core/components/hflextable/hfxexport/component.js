import cloneDeep from "lodash.clonedeep";
import axios from "axios";
import Utils from "#lib/componentUtils";

export default class {
    async onCreate(input, out) {
        this.state = {
            dataExportUID: {},
            dataExportColumns: input.columns,
        };
        if (input.admin) {
            await import( /* webpackChunkName: "hfxexport-admin" */ "./style-admin.scss");
        } else {
            await import( /* webpackChunkName: "hfxexport-frontend" */ "./style-frontend.scss");
        }
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
        }
    }

    async onMount() {
        this.utils = new Utils(this, this.language);
    }

    async show() {
        await this.utils.waitForComponent(`exportModal_hf_${this.input.id}`);
        const exportModal = this.getComponent(`exportModal_hf_${this.input.id}`);
        this.setState("dataExportUID", null);
        this.setState("dataExportColumns", cloneDeep(this.input.columns));
        exportModal.setActive(true).setCloseAllowed(true).setBackgroundCloseAllowed(true).setLoading(false);
        if (window.__heretic && window.__heretic.setTippy) {
            window.__heretic.setTippy();
        }
    }

    async notify(message, css = "is-success") {
        this.emit("notification", {
            message,
            css,
        });
    }

    async onExportButtonClick(button) {
        switch (button) {
        case "save":
            const {
                value
            } = document.getElementById(`export_hf_${this.input.id}_format`);
            const exportModal = this.getComponent(`exportModal_hf_${this.input.id}`);
            await this.utils.waitForComponent("exportColumns");
            const columnsDragList = this.getComponent("exportColumns").getColumns();
            exportModal.setCloseAllowed(false).setLoading(true);
            try {
                const response = await axios({
                    method: "post",
                    url: this.input.exportConfig.url,
                    data: {
                        format: value,
                        selected: this.input.checked,
                        columns: Object.keys(columnsDragList).filter(i => columnsDragList[i]),
                        language: this.language,
                    },
                    headers: this.input.headers || {},
                });
                this.setState("dataExportUID", response.data.uid);
                exportModal.setActive(false);
                await this.utils.waitForComponent(`exportDownloadModal_hf_${this.input.id}`);
                const exportDownloadModal = this.getComponent(`exportDownloadModal_hf_${this.input.id}`);
                exportDownloadModal.setActive(true).setCloseAllowed(true).setBackgroundCloseAllowed(true).setLoading(false);
            } catch (e) {
                exportModal.setCloseAllowed(true).setLoading(false);
                if (e && e.response && e.response.status === 403) {
                    this.emit("unauthorized");
                }
                await this.notify("htable_exportError", "is-danger");
            }
            break;
        }
    }

    onExportDownloadButtonClick() {
        //
    }
}
