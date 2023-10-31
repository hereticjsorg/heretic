import throttle from "lodash.throttle";
import debounce from "lodash.debounce";
import axios from "axios";
import cloneDeep from "lodash.clonedeep";
import Utils from "#lib/componentUtils";
import Query from "#lib/queryBrowser";

export default class {
    async onCreate(input, out) {
        this.defaultSortData = input.data.getTableDefaultSortColumn ? input.data.getTableDefaultSortColumn() : {};
        this.state = {
            loadConfig: input.data.getTableLoadConfig(),
            loading: false,
            columnData: input.data.getTableColumns(),
            columns: {},
            firstLoadFlag: false,
            data: [],
            pagination: [],
            access: [],
            filters: [],
            itemsPerPage: 30,
            totalPages: 0,
            total: 0,
            grandTotal: 0,
            searchText: "",
            currentPage: 1,
            sortField: this.defaultSortData.id || null,
            sortDirection: this.defaultSortData.direction || null,
            actions: input.data.getActions ? input.data.getActions() : [],
            checked: [],
            topButtons: input.data.getTopButtons ? input.data.getTopButtons() : [],
            clientWidth: 0,
            filtersEnabledCount: 0,
            bulkUpdateConfig: input.data.getTableBulkUpdateConfig ? input.data.getTableBulkUpdateConfig() : null,
            exportConfig: input.data.getTableExportConfig ? input.data.getTableExportConfig() : null,
            importConfig: input.data.getTableImportConfig ? input.data.getTableImportConfig() : null,
            recycleBin: input.data.getRecycleBinConfig ? input.data.getRecycleBinConfig() : null,
            deleteConfig: input.data.getTableLoadConfig ? input.data.getTableDeleteConfig() : null,
            deleteItems: [],
            dataOpen: false,
        };
        if (input.admin) {
            await import( /* webpackChunkName: "hflextable-admin" */ "./style-admin.scss");
        } else {
            await import( /* webpackChunkName: "hflextable-frontend" */ "./style-frontend.scss");
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
        if (process.browser) {
            this.setState("clientWidth", Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0));
        }
    }

    generatePagination() {
        const center = [this.state.currentPage - 2, this.state.currentPage - 1, this.state.currentPage, this.state.currentPage + 1, this.state.currentPage + 2];
        const filteredCenter = center.filter((p) => p > 1 && p < this.state.totalPages);
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

    async setWrapWidth() {
        // eslint-disable-next-line no-console
        console.log("setWrapWidth called");
        if (this.setWrapWidthRunning) {
            return;
        }
        this.setWrapWidthRunning = true;
        await this.utils.waitForElement(`hr_ft_wrap_${this.input.id}`);
        const wrap = document.getElementById(`hr_ft_wrap_${this.input.id}`);
        try {
            await this.utils.waitForComponent(`hr_ft_scroll_bottom_${this.input.id}`);
            const scrollBottom = this.getComponent(`hr_ft_scroll_bottom_${this.input.id}`);
            scrollBottom.setDisplay("none");
            wrap.style.display = "none";
            await this.utils.waitForElement(`hr_ft_dummy_${this.input.id}`);
            const dummy = document.getElementById(`hr_ft_dummy_${this.input.id}`);
            const {
                left,
                width,
            } = dummy.getBoundingClientRect();
            wrap.style.width = `${width}px`;
            scrollBottom.setWrapWidth(width);
            wrap.style.display = "block";
            scrollBottom.setDisplay("block");
            const actionColumnElements = document.querySelectorAll(`[data-hf-action='${this.input.id}']`);
            const spacerColumnElements = document.querySelectorAll(`[data-hf-spacer='${this.input.id}']`);
            const rowElements = document.querySelectorAll(`[data-hf-row='${this.input.id}']`);
            const actionsWidth = (this.state.actions.length * 30) + ((this.state.actions.length - 1) * 2) + 17;
            if (wrap.scrollWidth > width) {
                // Scrollbar is visible
                for (const el of actionColumnElements) {
                    el.style.position = "absolute";
                    el.style.left = `${left + width - actionsWidth}px`;
                    el.style.width = `${actionsWidth}px`;
                }
                for (const el of spacerColumnElements) {
                    el.style.width = `${actionsWidth}px`;
                }
                for (const el of rowElements) {
                    el.style.width = `${wrap.scrollWidth}px`;
                }
            } else {
                for (const el of actionColumnElements) {
                    el.style.position = "unset";
                    el.style.left = "unset";
                    el.style.width = `${actionsWidth}px`;
                }
                for (const el of spacerColumnElements) {
                    el.style.width = "unset";
                }
                for (const el of rowElements) {
                    el.style.width = "unset";
                }
            }
            scrollBottom.setInnerWidth(wrap.scrollWidth);
            wrap.scrollLeft = 0;
            scrollBottom.setScrollLeft(0);
            const spinnerWrap = document.getElementById(`hr_hf_loading_wrap_${this.input.id}`);
            if (spinnerWrap) {
                spinnerWrap.style.width = `${width}px`;
                spinnerWrap.style.height = `${wrap.getBoundingClientRect().height}px`;
                const spinner = document.getElementById(`hr_hf_loading_${this.input.id}`);
                spinner.style.left = `${width / 2 - 20}px`;
            }
            if (window.__heretic && window.__heretic.setTippy) {
                window.__heretic.setTippy();
            }
            scrollBottom.onWindowScroll();
        } catch (e) {
            // eslint-disable-next-line no-console
            console.log(e);
            // Ignore
        }
        this.setWrapWidthRunning = false;
    }

    onScroll() {
        const wrap = document.getElementById(`hr_ft_wrap_${this.input.id}`);
        const scrollBottom = this.getComponent(`hr_ft_scroll_bottom_${this.input.id}`);
        scrollBottom.setScrollLeft(wrap.scrollLeft);
    }

    async setLoading(flag) {
        if (flag) {
            this.setState("loading", true);
            // await this.setWrapWidth();
        } else {
            this.setState("loading", false);
        }
    }

    async notify(message, className = "is-success") {
        await this.utils.waitForComponent(`notify_hf_${this.input.id}`);
        if (this.getComponent(`notify_hf_${this.input.id}`)) {
            this.getComponent(`notify_hf_${this.input.id}`).show(window.__heretic.t(message), className);
        }
    }

    loadData(input = {}) {
        if (this.state.loading) {
            return;
        }
        return new Promise((resolve) => {
            if (!this.state.loadConfig || !this.state.loadConfig) {
                return;
            }
            setTimeout(async () => {
                await this.setLoading(true);
                try {
                    const response = await axios({
                        method: "post",
                        url: this.state.loadConfig.url,
                        data: {
                            searchText: input.searchText || this.state.searchText,
                            fields: Object.keys(this.state.columns),
                            sortField: input.sortField || this.state.sortField,
                            sortDirection: input.sortDirection || this.state.sortDirection,
                            itemsPerPage: this.state.itemsPerPage,
                            page: input.currentPage || this.state.currentPage,
                            filters: this.state.filters.filter(i => i.enabled),
                            language: this.language,
                        },
                        headers: this.input.headers || {},
                    });
                    this.setState("firstLoadFlag", true);
                    this.setState("data", response.data.items);
                    this.setState("access", response.data.access || {});
                    if (response.data.access) {
                        const columns = cloneDeep(this.state.columns);
                        for (const k of Object.keys(response.data.access)) {
                            const allowed = response.data.access[k];
                            if (!allowed) {
                                delete columns[k];
                            }
                        }
                        this.setState("columns", columns);
                    }
                    this.setState("totalPages", response.data.total < this.state.itemsPerPage ? 1 : Math.ceil(response.data.total / this.state.itemsPerPage));
                    this.setState("total", response.data.total);
                    this.setState("grandTotal", response.data.grandTotal);
                    if (input.currentPage) {
                        input.currentPage = parseInt(input.currentPage, 10);
                    }
                    for (const k of Object.keys(input)) {
                        this.setState(k, input[k]);
                        if (this.queryStringShorthands[k]) {
                            this.query.set(this.queryStringShorthands[k], input[k]);
                        }
                    }
                    this.generatePagination();
                    this.setState("checked", []);
                    this.emit("load-complete", response.data);
                } catch (e) {
                    if (e && e.response && e.response.status === 403) {
                        this.emit("unauthorized");
                        resolve();
                    }
                    this.notify("htable_loadingError", "is-danger");
                    this.setState("data", []);
                    this.setState("pagination", []);
                    setTimeout(() => this.setWrapWidth(), 10);
                } finally {
                    setTimeout(() => this.setLoading(false));
                    resolve();
                }
            }, 0);
        });
    }

    async onMount() {
        this.utils = new Utils(this, this.language);
        this.query = new Query();
        this.queryStringShorthands = {
            currentPage: "p",
            sortField: "f",
            sortDirection: "d",
            searchText: "s",
        };
        // const columns = this.store.get("columns") || {};
        const columns = {};
        if (Object.keys(columns).length !== Object.keys(this.state.columnData).length) {
            Object.keys(this.state.columnData).map(c => columns[c] = this.state.columnData[c].column && !this.state.columnData[c].hidden);
        }
        this.setState("columns", columns);
        this.setWrapWidthDelayed = throttle(this.setWrapWidth, 150);
        this.setWrapWidthDebounced = debounce(this.setWrapWidth, 50);
        await this.utils.waitForElement(`hr_ft_wrap_${this.input.id}`);
        const wrap = document.getElementById(`hr_ft_wrap_${this.input.id}`);
        if (window.innerWidth > 768) {
            window.addEventListener("resize", () => this.setWrapWidth());
        }
        wrap.addEventListener("scroll", this.onScroll.bind(this));
        const loadInput = {};
        const currentPage = this.query.get(this.queryStringShorthands["currentPage"]);
        const sortField = this.query.get(this.queryStringShorthands["sortField"]);
        const sortDirection = this.query.get(this.queryStringShorthands["sortDirection"]);
        const searchText = this.query.get(this.queryStringShorthands["searchText"]);
        if (currentPage && typeof currentPage === "string" && currentPage.match(/^[0-9]{1,99999}$/)) {
            loadInput.currentPage = parseInt(currentPage, 10);
        }
        if (sortField && typeof sortField === "string") {
            if (typeof this.state.columns[sortField] !== "undefined") {
                loadInput.sortField = sortField;
            }
        }
        if (sortDirection && typeof sortDirection === "string" && sortDirection.match(/^(asc|desc)$/)) {
            loadInput.sortDirection = sortDirection;
        }
        if (searchText && typeof searchText === "string" && searchText.length < 64) {
            loadInput.searchText = searchText.replace(/\+/gm, " ");
        }
        window.addEventListener("click", e => {
            if (document.getElementById(`hr_hf_data_dropdown_${this.input.id}`) && !document.getElementById(`hr_hf_data_dropdown_${this.input.id}`).contains(e.target)) {
                this.setState("dataOpen", false);
            }
        });
        await this.loadData(loadInput);
        const hereticContentWidth = document.getElementById("heretic_content").clientWidth;
        const hereticContentInterval = setInterval(() => {
            if (document.getElementById("heretic_content").clientWidth !== hereticContentWidth && document.getElementById("heretic_content").clientWidth > hereticContentWidth) {
                clearInterval(hereticContentInterval);
                this.setWrapWidth();
            }
        }, 10);
    }

    onWrapScroll(p) {
        const wrap = document.getElementById(`hr_ft_wrap_${this.input.id}`);
        wrap.scrollLeft = p;
    }

    onHeadClick(e) {
        if (e.target.closest("[data-checkbox]")) {
            return;
        }
        if (!e.target.closest("[data-id]")) {
            return;
        }
        const {
            id,
        } = e.target.closest("[data-id]").dataset;
        if (!this.state.columnData[id].sortable) {
            return;
        }
        const sortField = id;
        let sortDirection;
        if (this.state.sortField === id) {
            sortDirection = this.state.sortDirection === "asc" ? "desc" : "asc";
        } else {
            sortDirection = this.defaultSortData.direction;
        }
        this.setState("sortField", sortField);
        this.setState("sortDirection", sortDirection);
        this.loadData();
    }

    onPageClick(page) {
        this.loadData({
            currentPage: parseInt(page, 10),
        });
    }

    async onActionButtonClick(e) {
        e.preventDefault();
        if (this.state.loading) {
            return;
        }
        const buttonId = e.target.closest("[data-id]").dataset.id;
        const itemId = e.target.closest("[data-item]").dataset.item;
        this.emit("action-button-click", {
            buttonId,
            itemId
        });
        if (buttonId === "delete" && this.state.deleteConfig) {
            await this.utils.waitForComponent(`deleteConfirmation_hf_${this.input.id}`);
            const deleteConfirmation = this.getComponent(`deleteConfirmation_hf_${this.input.id}`);
            const deleteItems = [{
                id: itemId,
                title: String(this.state.data.find(i => i._id === itemId)[this.state.deleteConfig.titleId] || itemId),
            }];
            this.setState("deleteItems", deleteItems);
            deleteConfirmation.setActive(true).setCloseAllowed(true).setLoading(false);
        }
    }

    onRowClick(e) {
        if (e.target.closest("[data-checkboxid]")) {
            const {
                checkboxid,
            } = e.target.closest("[data-checkboxid]").dataset;
            const checkbox = document.querySelector(`[data-checkboxid="${checkboxid}"]`);
            const checkedData = checkbox.checked ? cloneDeep([...this.state.checked, checkboxid]) : cloneDeep(this.state.checked).filter(i => i !== checkboxid);
            this.setState("checked", checkedData);
        }
    }

    onCheckboxAllChange(e) {
        e.preventDefault(e);
        const {
            checked
        } = e.target;
        const checkedData = checked ? this.state.data.map(f => f._id) : [];
        this.setState("checked", checkedData);
    }

    async onTopButtonClick(e) {
        e.preventDefault();
        if (this.state.loading) {
            return;
        }
        const {
            id
        } = e.target.closest("[data-id]").dataset;
        this.emit("top-button-click", id);
        if (id === "delete" && this.state.deleteConfig && this.state.checked.length) {
            await this.utils.waitForComponent(`deleteConfirmation_hf_${this.input.id}`);
            const deleteConfirmation = this.getComponent(`deleteConfirmation_hf_${this.input.id}`);
            const deleteItems = [];
            for (const itemId of this.state.checked) {
                deleteItems.push({
                    id: itemId,
                    title: String(this.state.data.find(i => i._id === itemId)[this.state.deleteConfig.titleId] || itemId),
                });
            }
            this.setState("deleteItems", deleteItems);
            deleteConfirmation.setActive(true).setCloseAllowed(true).setLoading(false);
        } else if (id === "delete" && this.state.deleteConfig && !this.state.checked.length) {
            this.notify("htable_nothingSelected", "is-warning");
        }
    }

    onReloadClick(e) {
        e.preventDefault();
        this.loadData();
    }

    async onSettingsClick(e) {
        e.preventDefault();
        await this.utils.waitForComponent(`settings_hf_${this.input.id}`);
        this.getComponent(`settings_hf_${this.input.id}`).show();
    }

    onDataClick(e) {
        e.preventDefault();
        this.setState("dataOpen", true);
    }

    onBulkUpdateClick() {
        //
    }

    onImportClick() {
        //
    }

    onExportClick() {
        //
    }

    onRecycleBinClick() {
        //
    }

    onSearchInputFormSubmit() {
        //
    }

    onSearchInputChange() {
        //
    }

    onSearchButtonClearClick() {
        //
    }

    async onDeleteConfirmationButtonClick(id) {
        switch (id) {
        case "delete":
            await this.utils.waitForComponent(`deleteConfirmation_hf_${this.input.id}`);
            const deleteConfirmation = this.getComponent(`deleteConfirmation_hf_${this.input.id}`);
            deleteConfirmation.setCloseAllowed(true).setLoading(true);
            try {
                const deleteResult = await axios({
                    method: "post",
                    url: this.state.deleteConfig.url,
                    data: {
                        ids: this.state.deleteItems.map(i => i.id),
                    },
                    headers: this.input.headers || {},
                });
                this.setState("checked", []);
                await this.loadData({
                    currentPage: 1,
                });
                deleteConfirmation.setCloseAllowed(true).setLoading(false).setActive(false);
                this.notify(`${window.__heretic.t("htable_deleteSuccess")}: ${deleteResult.data.count}`);
            } catch {
                this.notify("htable_deleteError", "is-danger");
                deleteConfirmation.setCloseAllowed(true).setLoading(false);
            }
            break;
        }
    }

    onNotification(msg, css) {
        this.notify(msg, css);
    }

    onUpdate() {}
}
