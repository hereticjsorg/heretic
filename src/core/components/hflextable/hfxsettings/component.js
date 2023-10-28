import {
    v4 as uuidv4,
} from "uuid";
import cloneDeep from "lodash.clonedeep";
import Utils from "#lib/componentUtils";

export default class {
    async onCreate(input, out) {
        this.state = {
            settingsColumns: {},
            settingsTab: "columns",
            settingsItemsPerPage: 0,
            settingsFilters: [],
            settingColumnDrag: null,
            settingsFilterUID: null,
            settingsFilterEditSelectedId: null,
            settingsFilterEditSelectedValue: null,
            settingsFilterEditSelectedMode: null,
            settingsFilterEditSelectedModes: [],
            settingsFilterTypes: ["text", "select", "date", "checkbox"],
        };
        if (input.admin) {
            await import( /* webpackChunkName: "hfxsettings-admin" */ "./style-admin.scss");
        } else {
            await import( /* webpackChunkName: "hfxsettings-frontend" */ "./style-frontend.scss");
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

    async onSettingsButtonClick(id) {
        switch (id) {
        case "save":
            await this.saveSettings();
            break;
        }
    }

    onSettingsTabClick(e) {
        e.preventDefault();
        const {
            tab
        } = e.target.closest("[data-tab]").dataset;
        this.setState("settingsTab", tab);
        if (tab === "pages") {
            setTimeout(async () => {
                await this.utils.waitForComponent(`settingsPagesForm_${this.input.id}`);
                const settingsPagesForm = this.getComponent(`settingsPagesForm_${this.input.id}`);
                settingsPagesForm.focus();
            });
        }
    }

    onSettingsColumnCheckboxClick(e) {
        e.preventDefault();
        const {
            checked
        } = e.target;
        const {
            id
        } = e.target.dataset;
        const settingsColumns = cloneDeep(this.state.settingsColumns);
        settingsColumns[id] = checked;
        this.setState("settingsColumns", settingsColumns);
    }

    async notify(message, css = "is-success") {
        this.emit("notification", {
            message,
            css,
        });
    }

    async saveSettings() {
        const data = {};
        await this.utils.waitForComponent(`settingsModal_hf_${this.input.id}`);
        const settingsModal = this.getComponent(`settingsModal_hf_${this.input.id}`);
        let count = 0;
        for (const k of Object.keys(this.state.settingsColumns)) {
            count += this.state.settingsColumns[k] ? 1 : 0;
        }
        if (!count) {
            this.notify("htable_noColumnsSelected", "is-warning");
            return;
        }
        data.columns = cloneDeep(this.state.settingsColumns);
        this.setState("settingsTab", "pages");
        await this.utils.waitForComponent(`settingsPagesForm_${this.input.id}`);
        const settingsPagesForm = this.getComponent(`settingsPagesForm_${this.input.id}`);
        const pagesFormData = settingsPagesForm.process();
        if (!pagesFormData) {
            return;
        }
        data.itemsPerPage = pagesFormData.formTabs._default.itemsPerPage;
        this.setState("itemsPerPage", pagesFormData.formTabs._default.itemsPerPage);
        data.filters = cloneDeep(this.state.settingsFilters).map(item => ({
            enabled: item.enabled,
            id: item.id,
            mode: item.mode,
            value: item.value,
        }));
        data.filtersEnabledCount = data.filters.reduce((a, c) => a += c.enabled ? 1 : 0, 0);
        settingsModal.setActive(false).setCloseAllowed(true).setBackgroundCloseAllowed(false).setLoading(false);
        // eslint-disable-next-line no-console
        console.log(data);
    }

    onSettingsPagesFormSubmit() {
        this.saveSettings();
    }

    getFirstFilterableColumn() {
        for (const item of Object.keys(this.input.columnData)) {
            if (this.state.settingsFilterTypes.indexOf(this.input.columnData[item].type) > -1) {
                return item;
            }
        }
        return null;
    }

    setSettingsFilterModesState(type) {
        let modes;
        switch (type) {
        case "text":
            modes = ["eq", "neq", "rex", "nrex"];
            break;
        case "select":
            modes = ["oof", "nof"];
            break;
        case "date":
            modes = ["deq", "dgt", "dgte", "dlt", "dlte"];
            break;
        case "checkbox":
            modes = ["is"];
            break;
        default:
            modes = [];
        }
        this.setState("settingsFilterEditSelectedModes", modes);
    }

    async settingsSetFilterData(id) {
        switch (this.input.columnData[id].type) {
        case "select":
            await this.utils.waitForComponent(`filterModal_hf_${this.input.id}_hselect`);
            const hSelect = this.getComponent(`filterModal_hf_${this.input.id}_hselect`);
            const items = {};
            this.input.columnData[id].options.map(i => items[i.value] = i.label);
            hSelect.setItems(items);
            break;
        }
    }

    async settingsNewFilter(e) {
        e.preventDefault();
        await this.utils.waitForComponent(`filterModal_hf_${this.input.id}`);
        const filterModal = this.getComponent(`filterModal_hf_${this.input.id}`);
        this.setState("settingsFilterUID", null);
        filterModal.setActive(true).setCloseAllowed(true).setBackgroundCloseAllowed(false).setLoading(false);
        const firstColumn = this.getFirstFilterableColumn();
        this.setState("settingsFilterEditSelectedId", firstColumn);
        this.setState("settingsFilterEditSelectedValue", null);
        this.setSettingsFilterModesState(this.input.columnData[firstColumn].type);
        if (this.state.settingsFilterEditSelectedModes.length) {
            this.setState("settingsFilterEditSelectedMode", this.state.settingsFilterEditSelectedModes[0]);
        }
        await this.utils.waitForElement(`filterModal_hf_${this.input.id}_body`);
        await this.settingsSetFilterData(firstColumn);
        await this.utils.waitForElement(`filterModal_hf_${this.input.id}_select_id`);
        document.getElementById(`filterModal_hf_${this.input.id}_select_id`).focus();
    }

    settingsFilterCheckboxChange(e) {
        const {
            uid,
        } = e.target.closest("[data-uid]").dataset;
        const settingsFilters = cloneDeep(this.state.settingsFilters).map(item => ({
            ...item,
            enabled: item.uid === uid ? e.target.checked : item.enabled,
        }));
        this.setState("settingsFilters", settingsFilters);
    }

    async onSettingsFilterEditClick(e) {
        e.preventDefault();
        const {
            uid,
        } = e.target.closest("[data-uid]").dataset;
        const settingsFilter = this.state.settingsFilters.find(i => i.uid === uid);
        const filterModal = this.getComponent(`filterModal_hf_${this.input.id}`);
        filterModal.setActive(true).setCloseAllowed(true).setBackgroundCloseAllowed(false).setLoading(false);
        this.setState("settingsFilterUID", uid);
        this.setState("settingsFilterEditSelectedId", settingsFilter.id);
        this.setSettingsFilterModesState(this.input.columnData[settingsFilter.id].type);
        if (this.state.settingsFilterEditSelectedModes.length) {
            this.setState("settingsFilterEditSelectedMode", settingsFilter.mode);
        }
        await this.settingsSetFilterData(settingsFilter.id);
        this.settingsSetValue(settingsFilter.id, settingsFilter.value);
        await this.utils.waitForElement(`filterModal_hf_${this.input.id}_select_id`);
        document.getElementById(`filterModal_hf_${this.input.id}_select_id`).focus();
    }

    onSettingsFilterDeleteClick(e) {
        e.preventDefault();
        const {
            uid
        } = e.target.closest("[data-uid]").dataset;
        const settingsFilters = this.state.settingsFilters.filter(i => i.uid !== uid);
        this.setState("settingsFilters", settingsFilters);
    }

    onSettingsColumnDragEnd() {
        this.setState("settingColumnDrag", null);
        return true;
    }

    onSettingsColumnDragStart(e) {
        const {
            id
        } = e.target.closest("[data-id]").dataset;
        this.setState("settingColumnDrag", id);
        e.dataTransfer.setData("text", this.input.id);
        return true;
    }

    onSettingsColumnDragEnter(e) {
        e.preventDefault();
        e.target.classList.add("hr-hf-settings-columns-drop-area-over");
    }

    onSettingsColumnDragLeave(e) {
        e.preventDefault();
        e.target.classList.remove("hr-hf-settings-columns-drop-area-over");
    }

    onSettingsColumnDragOver(e) {
        e.preventDefault();
        e.target.classList.add("hr-hf-settings-columns-drop-area-over");
    }

    onSettingsColumnDrop(e) {
        const dataTransfer = e.dataTransfer.getData("text");
        e.target.classList.remove("hr-hf-settings-columns-drop-area-over");
        if (dataTransfer === this.input.id) {
            const {
                id
            } = e.target.closest("[data-id]").dataset;
            const settingsColumns = {};
            const settingsColumnsArr = Object.keys(this.state.settingsColumns).filter(i => i !== this.state.settingColumnDrag);
            const newIndex = settingsColumnsArr.findIndex(i => i === id);
            settingsColumnsArr.splice(newIndex, 0, this.state.settingColumnDrag);
            for (const c of settingsColumnsArr) {
                settingsColumns[c] = this.state.settingsColumns[c];
            }
            this.setState("settingsColumns", settingsColumns);
            return true;
        }
    }

    async settingsSetValue(id, value) {
        switch (this.input.columnData[id].type) {
        case "select":
            await this.utils.waitForComponent(`filterModal_hf_${this.input.id}_hselect`);
            this.getComponent(`filterModal_hf_${this.input.id}_hselect`).setSelected(value);
            break;
        case "date":
            await this.utils.waitForComponent(`filterModal_hf_${this.input.id}_hcalendar`);
            this.getComponent(`filterModal_hf_${this.input.id}_hcalendar`).setTimestamp(value ? value * 1000 : new Date().getTime());
            break;
        default:
            this.setState("settingsFilterEditSelectedValue", value);
        }
    }

    async show() {
        await this.utils.waitForComponent(`settingsModal_hf_${this.input.id}`);
        const settingsModal = this.getComponent(`settingsModal_hf_${this.input.id}`);
        this.setState("settingsColumns", cloneDeep(this.input.columns));
        this.setState("settingsTab", "columns");
        this.setState("settingsItemsPerPage", this.input.itemsPerPage);
        const settingsFilter = cloneDeep(this.input.filters).map(i => ({
            ...i,
            uid: uuidv4()
        }));
        this.setState("settingsFilters", settingsFilter);
        settingsModal.setActive(true).setCloseAllowed(true).setBackgroundCloseAllowed(false).setLoading(false);
        await this.utils.waitForComponent(`settingsPagesForm_${this.input.id}`);
        const settingsPagesForm = this.getComponent(`settingsPagesForm_${this.input.id}`);
        settingsPagesForm.deserializeData({
            _default: {
                itemsPerPage: this.state.settingsItemsPerPage,
            }
        });
    }

    onFilterEditFormSubmit(e) {
        e.preventDefault();
        this.saveFilter();
    }

    async onSettingsFilterEditSelectedChange(e) {
        e.preventDefault();
        this.setState("settingsFilterEditSelectedId", e.target.value);
        this.setSettingsFilterModesState(this.input.columnData[e.target.value].type);
        if (this.state.settingsFilterEditSelectedModes.length) {
            this.setState("settingsFilterEditSelectedMode", this.state.settingsFilterEditSelectedModes[0]);
        }
        this.setState("settingsFilterEditSelectedValue", null);
        await this.settingsSetFilterData(e.target.value);
    }

    onSettingsFilterEditModeChange(e) {
        e.preventDefault();
        this.setState("settingsFilterEditSelectedMode", e.target.value);
    }

    onSettingsFilterEditValueChange(e) {
        e.preventDefault();
        this.setState("settingsFilterEditSelectedValue", e.target.value);
    }

    onSettingsFilterEditCheckboxValueChange(e) {
        e.preventDefault();
        this.setState("settingsFilterEditSelectedValue", !!e.target.checked);
    }

    onFilterButtonClick(button) {
        switch (button) {
        case "save":
            this.saveFilter();
            break;
        }
    }

    async saveFilter() {
        const id = this.state.settingsFilterEditSelectedId;
        const mode = this.state.settingsFilterEditSelectedMode;
        let value;
        switch (this.input.columnData[id].type) {
        case "select":
            await this.utils.waitForComponent(`filterModal_hf_${this.input.id}_hselect`);
            value = this.getComponent(`filterModal_hf_${this.input.id}_hselect`).getSelected();
            break;
        case "date":
            await this.utils.waitForComponent(`filterModal_hf_${this.input.id}_hcalendar`);
            value = this.getComponent(`filterModal_hf_${this.input.id}_hcalendar`).getTimestamp();
            break;
        default:
            value = this.state.settingsFilterEditSelectedValue;
        }
        const settingsFilters = cloneDeep(this.state.settingsFilters);
        if (this.state.settingsFilterUID) {
            for (const filter of settingsFilters) {
                if (filter.uid === this.state.settingsFilterUID) {
                    filter.id = id;
                    filter.mode = mode;
                    filter.value = value;
                }
            }
            this.setState("settingsFilters", settingsFilters);
        } else {
            settingsFilters.push({
                enabled: true,
                uid: uuidv4(),
                id,
                mode,
                value,
            });
            this.setState("settingsFilters", settingsFilters);
        }
        await this.utils.waitForComponent(`filterModal_hf_${this.input.id}`);
        this.getComponent(`filterModal_hf_${this.input.id}`).setActive(false);
    }
}
