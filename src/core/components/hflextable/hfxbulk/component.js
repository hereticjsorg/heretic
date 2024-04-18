import {
    v4 as uuidv4,
} from "uuid";
import axios from "axios";
import cloneDeep from "lodash/cloneDeep";
import Utils from "#lib/componentUtils";

export default class {
    async onCreate(input, out) {
        this.state = {
            bulkItems: [],
            bulkItemUID: null,
            bulkItemSelectedId: null,
            bulkItemSelectedValue: null,
            bulkItemEditSelectValues: null,
            bulkItemTypes: ["text", "select", "date"],
        };
        if (input.admin) {
            await import( /* webpackChunkName: "hfxbulk-admin" */ "./style-admin.scss");
        } else {
            await import( /* webpackChunkName: "hfxbulk-frontend" */ "./style-frontend.scss");
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
        this.setState("bulkItems", []);
        this.setState("bulkItemUID", null);
        await this.utils.waitForComponent(`bulkUpdateModal_hf_${this.input.id}`);
        const bulkUpdateModal = this.getComponent(`bulkUpdateModal_hf_${this.input.id}`);
        bulkUpdateModal.setActive(true).setCloseAllowed(true).setBackgroundCloseAllowed(false).setLoading(false);
    }

    getFirstBulkUpdateColumn() {
        for (const item of Object.keys(this.input.columnData)) {
            if (this.state.bulkItemTypes.indexOf(this.input.columnData[item].type) > -1) {
                return item;
            }
        }
        return null;
    }

    async bulkUpdateData(id) {
        switch (this.input.columnData[id].type) {
        case "select":
            const bulkItemEditSelectValues = this.input.columnData[id].options.map(i => ({
                value: i.value,
                label: i.label,
            }));
            this.setState("bulkItemEditSelectValues", bulkItemEditSelectValues);
            break;
        }
    }

    async setBulkItemTabs() {
        if (this.input.tabs && this.input.tabs.length) {
            await this.utils.waitForComponent(`bulkItem_hf_${this.input.id}_tabs`);
            const hTabsSelect = this.getComponent(`bulkItem_hf_${this.input.id}_tabs`);
            const items = {};
            this.input.tabs.map(i => items[i.id] = i.label || window.__heretic.t("htable_defaultTab"));
            hTabsSelect.setItems(items, this.input.tabs.map(i => i.id));
            return hTabsSelect;
        }
        return null;
    }

    async bulkItemNew(e) {
        e.preventDefault();
        await this.utils.waitForComponent(`bulkItemModal_hf_${this.input.id}`);
        const bulkItemModal = this.getComponent(`bulkItemModal_hf_${this.input.id}`);
        this.setState("bulkItemUID", null);
        bulkItemModal.setActive(true).setCloseAllowed(true).setBackgroundCloseAllowed(false).setLoading(false);
        const firstColumn = this.getFirstBulkUpdateColumn();
        this.setState("bulkItemSelectedId", firstColumn);
        this.setState("bulkItemSelectedValue", null);
        await this.utils.waitForElement(`bulkItem_hf_${this.input.id}_body`);
        await this.bulkUpdateData(firstColumn);
        await this.utils.waitForElement(`bulkItem_hf_${this.input.id}_select_id`);
        await this.setBulkItemTabs();
        document.getElementById(`bulkItem_hf_${this.input.id}_select_id`).focus();
    }

    async onBulkUpdateButtonClick(button) {
        switch (button) {
        case "save":
            await this.utils.waitForComponent(`bulkUpdateModal_hf_${this.input.id}`);
            const bulkModal = this.getComponent(`bulkUpdateModal_hf_${this.input.id}`);
            if (!this.state.bulkItems.length) {
                bulkModal.setActive(false);
                await this.notify("htable_nothingToDo", "is-warning");
                return;
            }
            const bulkItems = cloneDeep(this.state.bulkItems).map(item => ({
                id: item.id,
                value: item.value,
                tabs: item.tabs && item.tabs.length ? item.tabs : ["_default"],
            }));
            try {
                bulkModal.setLoading(true).setCloseAllowed(false);
                await axios({
                    method: "post",
                    url: this.input.bulkUpdateConfig.url,
                    data: {
                        selected: this.input.checked,
                        bulkItems,
                        filters: this.input.filters.filter(i => i.enabled),
                        searchText: this.input.searchText,
                    },
                    headers: this.input.headers || {},
                });
                bulkModal.setActive(false);
                this.emit("update-success");
            } catch (e) {
                if (e && e.response && e.response.status === 403) {
                    this.emit("unauthorized");
                }
                await this.notify("htable_loadingError", "is-danger");
            } finally {
                bulkModal.setLoading(false).setCloseAllowed(true);
            }
            break;
        }
    }

    async onBulkItemEditClick(e) {
        e.preventDefault();
        const {
            uid,
        } = e.target.closest("[data-uid]").dataset;
        const bulkItem = this.state.bulkItems.find(i => i.uid === uid);
        const bulkModal = this.getComponent(`bulkItemModal_hf_${this.input.id}`);
        bulkModal.setActive(true).setCloseAllowed(true).setBackgroundCloseAllowed(false).setLoading(false);
        this.setState("bulkItemUID", uid);
        this.setState("bulkItemSelectedId", bulkItem.id);
        await this.bulkUpdateData(bulkItem.id);
        this.bulkSetValue(bulkItem.id, bulkItem.value);
        await this.utils.waitForElement(`bulkItem_hf_${this.input.id}_select_id`);
        const bulkTabs = await this.setBulkItemTabs();
        if (bulkTabs) {
            bulkTabs.setSelected(bulkItem.tabs);
        }
        document.getElementById(`bulkItem_hf_${this.input.id}_select_id`).focus();
    }

    async bulkSetValue(id, value) {
        switch (this.input.columnData[id].type) {
        case "date":
            await this.utils.waitForComponent(`bulkItem_hf_${this.input.id}_hcalendar`);
            this.getComponent(`bulkItem_hf_${this.input.id}_hcalendar`).setTimestamp(value ? value * 1000 : new Date().getTime());
            break;
        default:
            this.setState("bulkItemSelectedValue", value);
        }
    }

    onBulkItemDeleteClick(e) {
        e.preventDefault();
        const {
            uid
        } = e.target.closest("[data-uid]").dataset;
        const bulkItems = this.state.bulkItems.filter(i => i.uid !== uid);
        this.setState("bulkItems", bulkItems);
    }

    async notify(message, css = "is-success") {
        this.emit("notification", {
            message,
            css,
        });
    }

    onBulkItemSelectChange(e) {
        e.preventDefault();
        this.setState("bulkItemSelectedValue", e.target.value);
    }

    async saveBulkItem() {
        await this.utils.waitForComponent(`bulkItem_hf_${this.input.id}_tabs`);
        const tabs = this.getComponent(`bulkItem_hf_${this.input.id}_tabs`).getSelected();
        const id = this.state.bulkItemSelectedId;
        let value;
        switch (this.input.columnData[id].type) {
        case "date":
            await this.utils.waitForComponent(`bulkItem_hf_${this.input.id}_hcalendar`);
            value = this.getComponent(`bulkItem_hf_${this.input.id}_hcalendar`).getTimestamp();
            break;
        default:
            value = this.state.bulkItemSelectedValue;
        }
        const bulkItems = cloneDeep(this.state.bulkItems);
        for (const item of bulkItems) {
            if (this.state.bulkItemUID !== item.uid && item.id === id) {
                for (const tab of tabs) {
                    if (item.tabs.indexOf(tab) > -1) {
                        await this.notify("htable_duplicateBulkItem", "is-warning");
                        return;
                    }
                }
            }
        }
        if (this.state.bulkItemUID) {
            for (const item of bulkItems) {
                if (item.uid === this.state.bulkItemUID) {
                    item.id = id;
                    item.value = value;
                    item.tabs = tabs;
                }
            }
        } else {
            bulkItems.push({
                uid: uuidv4(),
                id,
                value,
                tabs,
            });
        }
        this.setState("bulkItems", bulkItems);
        await this.utils.waitForComponent(`bulkItemModal_hf_${this.input.id}`);
        this.getComponent(`bulkItemModal_hf_${this.input.id}`).setActive(false);
    }

    onBulkItemFormSubmit(e) {
        e.preventDefault();
        this.saveBulkItem();
    }

    onBulkItemButtonClick(button) {
        switch (button) {
        case "save":
            this.saveBulkItem();
            break;
        }
    }

    async onBulkItemSelectedChange(e) {
        e.preventDefault();
        this.setState("bulkItemSelectedId", e.target.value);
        this.setState("bulkItemSelectedValue", null);
        await this.bulkUpdateData(e.target.value);
    }

    onBulkItemValueChange(e) {
        e.preventDefault();
        this.setState("bulkItemSelectedValue", e.target.value);
    }
}
