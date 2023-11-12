import cloneDeep from "lodash.clonedeep";
import Utils from "#lib/componentUtils";

export default class {
    async onCreate(input, out) {
        this.state = {
            columnDrag: null,
            columns: input.columns,
        };
        if (input.admin) {
            await import( /* webpackChunkName: "hdraglist-admin" */ "./style-admin.scss");
        } else {
            await import( /* webpackChunkName: "hdraglist-frontend" */ "./style-frontend.scss");
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

    onDragEnd() {
        this.setState("columnDrag", null);
        return true;
    }

    onDragStart(e) {
        const {
            id
        } = e.target.closest("[data-id]").dataset;
        this.setState("columnDrag", id);
        e.dataTransfer.setData("text", this.input.id);
        return true;
    }

    onDragEnter(e) {
        e.preventDefault();
        e.target.classList.add("hr-hdg-drop-area-over");
    }

    onDragLeave(e) {
        e.preventDefault();
        e.target.classList.remove("hr-hdg-drop-area-over");
    }

    onDragOver(e) {
        e.preventDefault();
        e.target.classList.add("hr-hdg-drop-area-over");
    }

    onDrop(e) {
        // e.preventDefault();
        const dataTransfer = e.dataTransfer.getData("text");
        e.target.classList.remove("hr-hdg-drop-area-over");
        if (String(dataTransfer) === this.input.id) {
            const {
                id
            } = e.target.closest("[data-id]").dataset;
            const columns = {};
            const columnsArr = Object.keys(this.state.columns).filter(i => i !== this.state.columnDrag);
            const newIndex = columnsArr.findIndex(i => i === id);
            columnsArr.splice(newIndex, 0, this.state.columnDrag);
            for (const c of columnsArr) {
                columns[c] = this.state.columns[c];
            }
            this.setState("columns", columns);
            return true;
        }
    }

    onCheckboxClick(e) {
        e.preventDefault();
        const {
            checked
        } = e.target;
        const {
            id
        } = e.target.dataset;
        const columns = cloneDeep(this.state.columns);
        columns[id] = checked;
        this.setState("columns", columns);
    }

    getColumns() {
        return this.state.columns;
    }
}
