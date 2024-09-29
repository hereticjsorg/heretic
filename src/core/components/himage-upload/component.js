import { v4 as uuidv4 } from "uuid";
import cloneDeep from "lodash/cloneDeep";

export default class {
    async onCreate(input, out) {
        this.state = {
            data: [],
            drag: false,
            overGap: null,
        };
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
                /* webpackChunkName: "himages-admin" */ "./style-admin.scss"
            );
        } else {
            await import(
                /* webpackChunkName: "himages-frontend" */ "./style-frontend.scss"
            );
        }
    }

    onMount() {
        //
    }

    onImageAddClick(e) {
        e.preventDefault();
        document.getElementById(`hr_ui_${this.input.id}_upload`).click();
    }

    async onFileInputChange(e) {
        const data = cloneDeep(this.state.data);
        for (const file of Array.from(e.target.files)) {
            data.push({
                id: uuidv4(),
                file,
                image: URL.createObjectURL(file),
            });
        }
        this.setState("data", data);
    }

    onImageDelete(e) {
        const { id } = e.target.closest("[data-id]").dataset;
        this.setState(
            "data",
            cloneDeep(this.state.data).filter((i) => i.id !== id),
        );
    }

    onDragStart(e) {
        const { id } = e.target.closest("[data-id]").dataset;
        e.dataTransfer.setData("text/plain", `__hiu__${this.input.id}_${id}`);
        this.setState("drag", true);
    }

    onDragEnd(e) {
        e.preventDefault();
        this.setState("drag", false);
    }

    onDrag(e) {
        e.preventDefault();
    }

    onGapDragOver(e) {
        e.preventDefault();
    }

    onGapDragEnter(e) {
        e.preventDefault();
        const { id } = e.target.closest("[data-id]").dataset;
        this.setState("overGap", id);
    }

    onGapDragLeave(e) {
        e.preventDefault();
        this.setState("overGap", null);
    }

    onGapDrop(e) {
        e.preventDefault();
        let data = cloneDeep(this.state.data);
        if (
            !e.dataTransfer.getData("text/plain") ||
            !e.dataTransfer.getData("text/plain").match(/^__hiu__/)
        ) {
            e.preventDefault();
            return;
        }
        const [, itemId] = e.dataTransfer
            .getData("text/plain")
            .replace(/^__hiu__/, "")
            .split(/_/);
        const node = data.find(i => i.id === itemId);
        data = data.filter(i => i.id !== itemId);
        const overGapIndex = this.state.overGap === "first" ? 0 : data.findIndex(i => i.id === this.state.overGap);
        data.splice(this.state.overGap === "first" ? 0 : overGapIndex + 1, 0, node);
        this.setState("overGap", null);
        this.setState("data", data);
    }

    getData() {
        return this.state.data;
    }

    setData(data) {
        this.setState("data", data);
    }
}
