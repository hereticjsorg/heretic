import { v4 as uuidv4 } from "uuid";
import cloneDeep from "lodash/cloneDeep";
import isEqual from "lodash/isEqual";
import Utils from "#lib/componentUtils.js";

export default class {
    async onCreate(input, out) {
        this.state = {
            ready: false,
            data: [],
            drag: false,
            overGap: null,
            clickedId: null,
        };
        this.siteId = out.global.siteId;
        this.language = out.global.language;
        if (process.browser) {
            window.__heretic = window.__heretic || {};
            window.__heretic.outGlobal =
                window.__heretic.outGlobal || out.global;
            this.siteId =
                out.global.siteId || window.__heretic.outGlobal.siteId;
            this.language =
                this.language || window.__heretic.outGlobal.language;
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

    async onMount() {
        this.utils = new Utils(this, this.language);
        await this.utils.waitForLanguageData();
        this.t = window.__heretic.t;
        this.setState("ready", true);
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
        this.emit("changed", this.state.data);
    }

    onImageDelete(e) {
        e.stopPropagation();
        e.preventDefault();
        const { id } = e.target.closest("[data-id]").dataset;
        this.setState(
            "data",
            cloneDeep(this.state.data).filter((i) => i.id !== id),
        );
        this.emit("changed", this.state.data);
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
        this.emit("changed", this.state.data);
    }

    getData() {
        return this.state.data;
    }

    setData(data) {
        this.setState("data", data);
    }

    async onImageClick(e) {
        if (!this.input.clickable) {
            return;
        }
        e.preventDefault();
        const { id } = e.target.closest("[data-id]").dataset;
        this.setState("clickedId", id);
        await this.utils.waitForComponent(`hr_ui_${this.input.id}_imageDataModal`);
        this.getComponent(`hr_ui_${this.input.id}_imageDataModal`).setActive(true);
        const item = this.state.data.find(i => i.id === this.state.clickedId);
        if (item) {
            const metadata = item.metadata || {};
            await this.utils.waitForComponent(`hr_ui_${this.input.id}_imageDataForm`);
            const himageForm = this.getComponent(`hr_ui_${this.input.id}_imageDataForm`);
            for (const k of Object.keys(metadata)) {
                himageForm.setValue(k, metadata[k]);
            }
        }
    }

    onImageDataModalButtonClick(btn) {
        if (btn === "save") {
            this.onImageDataModalSubmit();
        }
    }

    async onImageDataModalSubmit() {
        await this.utils.waitForComponent(`hr_ui_${this.input.id}_imageDataForm`);
        const himageForm = this.getComponent(`hr_ui_${this.input.id}_imageDataForm`);
        himageForm.setErrors(false);
        himageForm.setErrorMessage(false);
        const validationResult = himageForm.validate(himageForm.saveView());
        if (validationResult) {
            return himageForm.setErrors(himageForm.getErrorData(validationResult));
        }
        const formData = himageForm.serializeData();
        const data = formData.formTabs._default;
        const oldData = cloneDeep(this.state.data);
        const item = this.state.data.find(i => i.id === this.state.clickedId);
        item.metadata = data;
        this.setStateDirty("data", this.state.data);
        this.getComponent(`hr_ui_${this.input.id}_imageDataModal`).setActive(false);
        if (!isEqual(oldData, this.state.data)) {
            this.emit("changed", this.state.data);
        }
    }
}
