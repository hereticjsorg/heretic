const store = require("store2");
const axios = require("axios").default;
const cloneDeep = require("lodash.clonedeep");
const debounce = require("lodash.debounce");
const {
    v4: uuidv4
} = require("uuid");
const Utils = require("../../lib/componentUtils").default;
const Query = require("../../lib/queryBrowser").default;

module.exports = class {
    async onCreate(input, out) {
        this.defaultSortData = input.formData.getTableDefaultSortColumn ? input.formData.getTableDefaultSortColumn() : {};
        this.state = {
            init: false,
            columnData: input.formData.getTableColumns(),
            columns: [],
            tabs: input.formData.getTabs ? input.formData.getTabs : [{
                id: "_default",
                label: null,
            }],
            sortField: this.defaultSortData.id || null,
            sortDirection: this.defaultSortData.direction || null,
            actionColumn: input.formData.isActionColumn(),
            checkboxColumn: input.formData.isCheckboxColumn(),
            actions: input.formData.getActions(),
            topButtons: input.formData.getTopButtons(),
            loadConfig: input.formData.getTableLoadConfig(),
            bulkUpdateConfig: input.formData.getTableBulkUpdateConfig(),
            exportConfig: input.formData.getTableExportConfig(),
            recycleBin: input.formData.getRecycleBinConfig(),
            data: [],
            firstLoadFlag: false,
            loading: true,
            currentPage: 1,
            totalPages: 1,
            itemsPerPage: 30,
            filters: [],
            filtersEnabledCount: 0,
            pagination: [],
            checkboxes: [],
            checkboxesAll: false,
            deleteConfig: input.formData.getTableLoadConfig ? input.formData.getTableDeleteConfig() : null,
            deleteItems: [],
            searchText: "",
            settingsTab: "columns",
            settingsColumns: [],
            settingColumnDrag: null,
            settingsItemsPerPage: 30,
            settingsFilterTypes: ["text", "select", "date"],
            settingsFilters: [],
            settingsFilterUID: null,
            settingsFilterEditSelectedModes: [],
            settingsFilterEditSelectedId: null,
            settingsFilterEditSelectedMode: null,
            settingsFilterEditSelectedValue: "",
            bulkItemTypes: ["text", "select", "date"],
            bulkItems: [],
            bulkItemEditSelectValues: [],
            bulkItemUID: null,
            bulkItemSelectedId: null,
            bulkItemSelectedValue: "",
            dataOpen: false,
            dataExportUID: null,
            clientWidth: 0,
            dataExportColumns: [],
            exportColumnDrag: null,
            recycleBinList: [],
            recycleBinPagination: [],
            recycleBinTotalPages: 1,
            currentRecycleBinListPage: 1,
            recycleDeleteItems: [],
            lockedItems: {},
            total: 0,
            grandTotal: 0,
            selected: 0,
        };
        this.queryStringShorthands = {
            currentPage: "p",
            sortField: "f",
            sortDirection: "d",
            searchText: "s",
        };
        if (input.admin) {
            await import(/* webpackChunkName: "htable-admin" */ "./style-admin.scss");
        } else {
            await import(/* webpackChunkName: "htable-frontend" */ "./style-frontend.scss");
        }
        this.language = process.browser ? window.__heretic.outGlobal.language : out.global.language;
        this.stickyElementsUpdate = 0;
    }

    getElements() {
        const elementWrap = document.getElementById(`hr_ht_wrap_${this.input.id}`);
        const elementDummy = document.getElementById(`hr_ht_dummy_${this.input.id}`);
        const elementGlobalWrap = document.getElementById(`hr_ht_global_wrap_${this.input.id}`);
        const elementTableContainer = document.getElementById(`hr_ht_table_container_${this.input.id}`);
        const mainWrap = document.getElementById(`hr_ht_wrap_${this.input.id}`);
        const table = document.getElementById(`hr_ht_table_${this.input.id}`);
        const actionsTh = document.getElementById(`hr_ht_th_actions_${this.input.id}`);
        const actionsColumns = document.getElementById(`hr_ht_th_actions_columns_${this.input.id}`);
        const tableControls = document.getElementById(`hr_ht_table_controls_${this.input.id}`);
        const actionCellWraps = document.getElementsByClassName(`hr-ht-action-cell-wrap-${this.input.id}`);
        const actionCells = document.getElementsByClassName(`hr-ht-action-cell-${this.input.id}`);
        const actionCellControl = document.getElementById(`hr_ht_action_cell_control_${this.input.id}`);
        const elementLoading = document.getElementById(`hr_ht_loading_${this.input.id}`);
        const elementLoadingWrap = document.getElementById(`hr_ht_loading_wrap_${this.input.id}`);
        const elementHeaderActions = document.getElementById(`hr_ht_header_actions_${this.input.id}`);
        return {
            elementWrap,
            elementDummy,
            elementGlobalWrap,
            elementTableContainer,
            mainWrap,
            table,
            actionsTh,
            actionsColumns,
            tableControls,
            actionCellWraps,
            actionCellControl,
            actionCells,
            elementLoading,
            elementLoadingWrap,
            elementHeaderActions,
        };
    }

    restoreWidthFromSavedRatios() {
        const ratios = this.store.get("ratios");
        if (ratios) {
            const widths = this.columnRatiosToWidths(ratios);
            this.setColumnWidths(widths);
        }
    }

    getCurrentTableWidth() {
        // const {
        //     elementGlobalWrap,
        // } = this.getElements();
        // this.utils.waitForElement(`hr_ht_global_wrap_${this.input.id}`);
        // const elementGlobalRect = elementGlobalWrap.getBoundingClientRect();
        // return elementGlobalRect.width;
        const {
            elementWrap,
            tableControls,
            elementDummy,
        } = this.getElements();
        if (!elementWrap || !tableControls || !elementDummy) {
            return 0;
        }
        const elementWrapDisplay = elementWrap.style.display;
        const tableControlsDisplay = tableControls.style.display;
        elementWrap.style.display = "none";
        tableControls.style.display = "none";
        elementDummy.style.display = "block";
        this.utils.waitForElement(`hr_ht_dummy_${this.input.id}`);
        const dummyRect = elementDummy.getBoundingClientRect();
        elementWrap.style.display = elementWrapDisplay;
        tableControls.style.display = tableControlsDisplay;
        elementDummy.style.display = "none";
        return dummyRect.width;
    }

    setClientWidth() {
        this.setState("clientWidth", Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0));
    }

    setTableWidth() {
        this.setClientWidth();
        if (this.state.loading) {
            return;
        }
        this.tableContainerWidth = this.getCurrentTableWidth();
        const {
            table,
            elementTableContainer,
            elementWrap,
        } = this.getElements();
        if (!table || !elementTableContainer || !elementWrap) {
            return;
        }
        this.resetColumnWidths();
        const currentTableWidth = this.getCurrentTableWidth();
        elementTableContainer.style.width = `${this.tableContainerWidth}px`;
        elementWrap.style.width = `${this.tableContainerWidth}px`;
        table.style.width = `${this.tableContainerWidth}px`;
        this.elementTableWidth = table.getBoundingClientRect().width;
        table.style.width = `${currentTableWidth > this.elementTableWidth ? currentTableWidth : this.elementTableWidth}px`;
    }

    setTableDimensions() {
        this.setTableWidth();
        const {
            table,
        } = this.getElements();
        const elementScrollWrapper = document.getElementById(`hr_ht_table_scroll_wrapper_${this.input.id}`);
        if (elementScrollWrapper) {
            if (this.tableContainerWidth < this.elementTableWidth) {
                const elementScroll = document.getElementById(`hr_ht_table_scroll_${this.input.id}`);
                elementScroll.style.width = `${this.elementTableWidth}px`;
                elementScrollWrapper.style.width = `${this.tableContainerWidth}px`;
                elementScrollWrapper.style.display = "block";
            } else {
                elementScrollWrapper.style.display = "none";
            }
        }
        this.restoreWidthFromSavedRatios();
        this.placeStickyElements();
        const hereticContent = document.getElementById("heretic_content");
        if (hereticContent && !this.tableDimensionsResetFlag) {
            this.tableDimensionsResetFlag = true;
            const hereticContentWidth = this.getComputedStyles(hereticContent).width;
            if (hereticContentWidth > this.tableContainerWidth) {
                setTimeout(() => this.setTableDimensionsDebounced(), 350);
            }
        }
        this.setLoadingWrapDimensions();
        setTimeout(() => table.style.opacity = "1", 10);
    }

    onScrollWrapScroll() {
        const scrollWrapper = document.getElementById(`hr_ht_table_scroll_wrapper_${this.input.id}`);
        const tableContainer = document.getElementById(`hr_ht_table_container_${this.input.id}`);
        if (scrollWrapper && tableContainer) {
            tableContainer.scrollLeft = scrollWrapper.scrollLeft;
        }
    }

    onTableContainerScroll() {
        const scrollWrapper = document.getElementById(`hr_ht_table_scroll_wrapper_${this.input.id}`);
        const tableContainer = document.getElementById(`hr_ht_table_container_${this.input.id}`);
        if (scrollWrapper && tableContainer) {
            scrollWrapper.scrollLeft = tableContainer.scrollLeft;
        }
    }

    getComputedStyles(element) {
        const cs = document.defaultView.getComputedStyle(element, null);
        const styles = {};
        for (const s of cs) {
            styles[s] = cs.getPropertyValue(s);
            styles[s] = styles[s].match(/^[\d\\.]+px$/) ? parseFloat(styles[s].replace(/px$/, "")) : styles[s];
        }
        return styles;
    }

    async setLoadingWrapDimensions() {
        try {
            await this.utils.waitForElement(`hr_ht_loading_${this.input.id}`);
        } catch {
            return;
        }
        const {
            elementWrap,
            elementLoadingWrap,
            elementLoading,
        } = this.getElements();
        elementLoadingWrap.style.width = `${elementWrap.getBoundingClientRect().width}px`;
        elementLoadingWrap.style.height = `${elementWrap.getBoundingClientRect().height}px`;
        elementLoading.style.left = `${(elementWrap.getBoundingClientRect().width / 2) - (elementLoading.style.width / 2)}px`;
        elementLoading.style.top = `${window.pageYOffset + 10}px`;
        elementLoading.style.opacity = "1";
    }

    async setLoading(flag) {
        if (flag) {
            this.setState("loading", true);
            await this.setLoadingWrapDimensions();
        } else {
            const {
                elementLoading,
            } = this.getElements();
            if (elementLoading) {
                elementLoading.style.opacity = "0";
            }
            this.setState("loading", false);
        }
    }

    async placeStickyElements() {
        if (this.stickyElementsUpdate > 0) {
            return;
        }
        // Get elements
        const {
            mainWrap,
            table,
            actionsTh,
            actionsColumns,
            tableControls,
            actionCellWraps,
            actionCellControl,
        } = this.getElements();
        // If some element is missing, stop
        if (!mainWrap || !table || !actionsTh || !actionsColumns || !tableControls || !actionCellWraps || !actionCellControl) {
            return;
        }
        const firstActionCell = document.getElementById(`hr_ht_action_cell_${this.input.id}_0`);
        if (!firstActionCell) {
            return;
        }
        // Calculate and set "Actions" column width
        if (!this.actionColumnWidth) {
            if (firstActionCell.getBoundingClientRect().width >= actionsTh.getBoundingClientRect().width) {
                this.actionColumnWidth = firstActionCell.getBoundingClientRect().width - 1;
            } else {
                this.actionColumnWidth = actionsTh.getBoundingClientRect().width - 1;
            }
        }
        actionsColumns.style.width = `${this.actionColumnWidth}px`;
        actionsTh.style.width = `${this.actionColumnWidth}px`;
        // setTimeout(async () => {
        this.stickyElementsUpdate = actionCellWraps.length;
        // this.setState("loading", true);
        for (const actionCellWrap of actionCellWraps) {
            // eslint-disable-next-line no-loop-func
            window.requestAnimationFrame(async () => {
                try {
                    // await this.utils.waitForElement(`hr_ht_action_cell_${this.input.id}_${actionCellWrap.dataset.index}`);
                    const actionElement = document.getElementById(`hr_ht_action_cell_${this.input.id}_${actionCellWrap.dataset.index}`);
                    actionElement.style.opacity = "0";
                    tableControls.style.opacity = "0";
                    // actionCellWrap.style.height = "unset";
                    actionElement.style.height = "unset";
                    const actionColumnHeight = actionElement.getBoundingClientRect().height >= actionCellWrap.getBoundingClientRect().height ? actionElement.getBoundingClientRect().height : actionCellWrap.getBoundingClientRect().height;
                    // actionCellWrap.style.height = `${actionColumnHeight}px`;
                    actionElement.style.width = `${this.actionColumnWidth + 2}px`;
                    actionElement.style.height = `${actionColumnHeight - 2}px`;
                    actionElement.style.top = `${actionCellWrap.getBoundingClientRect().top - mainWrap.getBoundingClientRect().top + 1}px`;
                    if (actionCellWrap.getBoundingClientRect().top - mainWrap.getBoundingClientRect().top + 1 > 0) {
                        actionElement.style.opacity = "1";
                        tableControls.style.opacity = "1";
                    }
                } catch {
                    // Ignore
                } finally {
                    this.stickyElementsUpdate -= 1;
                    // if (this.stickyElementsUpdate === 0) {
                    //     this.setState("loading", false);
                    // }
                }
            });
        }
        // }, 0);
        table.style.height = "unset";
        tableControls.style.width = `${this.actionColumnWidth + 2}px`;
        tableControls.style.height = `${table.getBoundingClientRect().height}px`;
        tableControls.style.left = `${mainWrap.getBoundingClientRect().width - this.actionColumnWidth - 2}px`;
        actionCellControl.style.width = `${this.actionColumnWidth + 2}px`;
        actionCellControl.style.height = `${actionsTh.getBoundingClientRect().height - 1}px`;
        actionCellControl.style.opacity = "1";
        tableControls.style.opacity = "1";
        this.onTableContainerScroll();
    }

    async init() {
        if (this.state.init) {
            return;
        }
        this.globalWrapResizeObserver.unobserve(document.getElementById(`hr_ht_global_wrap_${this.input.id}`));
        this.setState("init", true);
        this.setClientWidth();
        await this.utils.waitForElement(`hr_ht_table_${this.input.id}`);
        const columns = this.store.get("columns") || {};
        if (Object.keys(columns).length !== Object.keys(this.state.columnData).length) {
            Object.keys(this.state.columnData).map(c => columns[c] = this.state.columnData[c].column && !this.state.columnData[c].hidden);
        }
        this.setState("columns", columns);
        if (this.state.clientWidth >= 1023) {
            window.addEventListener("resize", this.setTableDimensions.bind(this));
        }
        window.addEventListener("orientationchange", this.setTableDimensions.bind(this));
        window.addEventListener("mouseup", this.onColumnMouseUp.bind(this));
        this.restoreWidthFromSavedRatios();
        const scrollWrapper = document.getElementById(`hr_ht_table_scroll_wrapper_${this.input.id}`);
        const tableContainer = document.getElementById(`hr_ht_table_container_${this.input.id}`);
        this.onScrollWrapScrollDebounced = debounce(this.onScrollWrapScroll, 50);
        if (scrollWrapper && tableContainer) {
            scrollWrapper.addEventListener("scroll", this.onScrollWrapScrollDebounced.bind(this));
            tableContainer.addEventListener("scroll", this.onTableContainerScroll.bind(this));
            scrollWrapper.addEventListener("touchmove", this.onScrollWrapScrollDebounced.bind(this));
            tableContainer.addEventListener("touchmove", this.onTableContainerScroll.bind(this));
        }
        tableContainer.dispatchEvent(new CustomEvent("scroll"));
        this.query = new Query();
        const loadInput = {};
        if (this.input.queryString) {
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
                loadInput.searchText = searchText;
            }
        }
        this.loadDataDebounced = debounce(this.loadData, 500);
        this.placeStickyElementsDebounced = debounce(this.placeStickyElements, 100);
        this.setTableDimensionsDebounced = debounce(this.setTableDimensions, 100);
        this.moveColumnDebounced = debounce(this.moveColumn, 10);
        this.setState("filters", this.store.get("filters") || []);
        this.setState("filtersEnabledCount", this.state.filters.reduce((a, c) => a += c.enabled ? 1 : 0, 0));
        if (this.store.get("itemsPerPage")) {
            this.setState("itemsPerPage", parseInt(this.store.get("itemsPerPage"), 10));
        }
        this.setLoadingWrapDimensions();
        if (this.input.autoLoad) {
            await this.loadData(loadInput, true);
        } else {
            this.setState("loading", false);
            this.needToUpdateTableWidth = true;
        }
        this.needToUpdateTableWidth = true;
        const hereticContent = document.getElementById("heretic_content");
        if (hereticContent) {
            this.tableContainerWidth = this.getComputedStyles(hereticContent).width;
        }
        setTimeout(() => this.setTableDimensionsDebounced());
        window.addEventListener("click", e => {
            if (document.getElementById(`hr_ht_data_dropdown_${this.input.id}`) && !document.getElementById(`hr_ht_data_dropdown_${this.input.id}`).contains(e.target)) {
                this.setState("dataOpen", false);
            }
        });
    }

    async onMount() {
        this.utils = new Utils(this);
        this.store = store.namespace(`heretic_htable_${this.input.id}`);
        await this.utils.waitForElement(`hr_ht_global_wrap_${this.input.id}`);
        const globalWrap = document.getElementById(`hr_ht_global_wrap_${this.input.id}`);
        this.setClientWidth();
        const initDebounced = debounce(this.init.bind(this), 100);
        this.globalWrapResizeObserver = new ResizeObserver(() => initDebounced());
        this.globalWrapResizeObserver.observe(globalWrap);
    }

    getPrevVisibleColumn(index) {
        for (let i = index; i >= 0; i -= 1) {
            const column = Object.keys(this.state.columns)[i];
            if (this.state.columns[column]) {
                return column;
            }
        }
    }

    onColumnMouseDown(e) {
        if (this.stickyElementsUpdate > 0) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        this.columnResizing = e.target.dataset.id;
        this.prevColumn = this.getPrevVisibleColumn(Object.keys(this.state.columns).findIndex(i => i === this.columnResizing) - 1);
        this.moveStartX = e.touches ? e.touches[0].pageX : e.pageX;
    }

    getColumnWidths() {
        const widths = {};
        for (const c of Object.keys(this.state.columns)) {
            if (this.state.columns[c]) {
                const columnElement = document.getElementById(`hr_ht_column_${c}`);
                if (columnElement) {
                    const columnRect = columnElement.getBoundingClientRect();
                    widths[c] = columnRect.width;
                }
            }
        }
        return widths;
    }

    setColumnWidths(widths) {
        for (const c of Object.keys(widths)) {
            const columnElement = document.getElementById(`hr_ht_column_${c}`);
            if (columnElement) {
                columnElement.style.width = `${widths[c]}px`;
            }
        }
    }

    getLastVisibleColumnIndex() {
        let index = -1;
        let counter = 1;
        for (const c of Object.keys(this.state.columns)) {
            if (this.state.columns[c]) {
                index = counter;
            }
            counter += 1;
        }
        return index;
    }

    resetColumnWidths() {
        for (const c of Object.keys(this.state.columns)) {
            const columnElement = document.getElementById(`hr_ht_column_${c}`);
            if (columnElement) {
                columnElement.style.width = "unset";
            }
        }
    }

    onColumnMouseUp(e) {
        e.stopPropagation();
        e.preventDefault();
        setTimeout(() => this.columnResizing = false, 50);
    }

    columnWidthsToRatios(widths) {
        const columnRatios = {};
        Object.keys(this.state.columns).map(k => columnRatios[k] = parseFloat(widths[k] / this.tableContainerWidth));
        return columnRatios;
    }

    columnRatiosToWidths(ratios) {
        const widths = {};
        Object.keys(ratios).map(k => widths[k] = parseFloat(ratios[k] * this.tableContainerWidth));
        return widths;
    }

    moveColumn(e) {
        if (this.stickyElementsUpdate > 0) {
            return;
        }
        window.requestAnimationFrame(() => {
            const oldColumnWidths = this.getColumnWidths();
            const ox = e.touches ? e.touches[0].pageX : e.pageX;
            const currentMover = document.getElementById(`hr_ht_mover_${this.columnResizing}`);
            if (!currentMover) {
                return;
            }
            const currentMoverRectX = currentMover.getBoundingClientRect().x;
            const diffX = ox - this.moveStartX;
            const currentColumn = document.getElementById(`hr_ht_column_${this.columnResizing}`);
            const prevColumn = document.getElementById(`hr_ht_column_${this.prevColumn}`);
            const currentColumnRect = currentColumn.getBoundingClientRect();
            const prevColumnRect = prevColumn.getBoundingClientRect();
            prevColumn.style.width = `${prevColumnRect.width + diffX}px`;
            currentColumn.style.width = `${currentColumnRect.width - diffX}px`;
            if (currentMoverRectX !== currentMover.getBoundingClientRect().x) {
                this.moveStartX = currentMover.getBoundingClientRect().x;
            }
            const newColumnWidths = this.getColumnWidths();
            for (const column of Object.keys(this.state.columns)) {
                if (column !== this.prevColumn && column !== this.columnResizing && oldColumnWidths[column] && newColumnWidths[column] && parseInt(newColumnWidths[column], 10) !== parseInt(oldColumnWidths[column], 10)) {
                    this.setColumnWidths(oldColumnWidths);
                    return;
                }
            }
            this.store.set("ratios", this.columnWidthsToRatios(newColumnWidths));
            // this.placeStickyElementsDebounced();
        });
    }

    onColumnMove(e) {
        if (!this.columnResizing) {
            return;
        }
        e.stopPropagation();
        this.moveColumn(e);
    }

    async onColumnThClick(e) {
        if (this.columnResizing) {
            return;
        }
        e.preventDefault();
        const {
            id
        } = e.target.closest("[data-id]").dataset;
        if (!id || !this.state.columnData[id] || !this.state.columnData[id].sortable) {
            return;
        }
        let {
            sortDirection,
            sortField
        } = this.state;
        if (id === sortField) {
            sortDirection = this.state.sortDirection === "asc" ? "desc" : "asc";
        } else {
            sortField = id;
            sortDirection = this.defaultSortData.sortDirection || "asc";
        }
        await this.loadData({
            sortField,
            sortDirection
        });
        this.setState("sortField", sortField);
        this.setState("sortDirection", sortDirection);
    }

    loadData(input = {}, firstTime = false) {
        if (!firstTime && this.state.loading) {
            return;
        }
        return new Promise((resolve) => {
            if (!this.state.loadConfig || !this.state.loadConfig) {
                return;
            }
            setTimeout(async () => {
                // await this.utils.waitForElement(`hr_ht_noRecords_${this.input.id}`);
                await this.setLoading(true);
                await this.utils.waitForElement(`hr_ht_table_controls_${this.input.id}`);
                const {
                    tableControls,
                    actionCellControl,
                } = this.getElements();
                tableControls.style.display = "block";
                // Set 0 to hide action cell control during load
                actionCellControl.style.opacity = "0";
                tableControls.style.opacity = "0";
                this.utils.waitForElement(`hr_ht_loading_wrap_${this.input.id}`);
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
                        if (this.input.queryString) {
                            this.query.set(this.queryStringShorthands[k], input[k]);
                        }
                    }
                    this.generatePagination();
                    this.setTableDimensionsDebounced();
                    if (!response.data.items.length) {
                        tableControls.style.display = "none";
                    }
                    this.emit("load-complete", response.data);
                    if (input && input.focusOnSearch) {
                        setTimeout(async () => {
                            await this.utils.waitForElement(`hr_ht_table_search_${this.input.id}`);
                            document.getElementById(`hr_ht_table_search_${this.input.id}`).focus();
                        });
                    }
                    setTimeout(() => {
                        this.needToUpdateTableWidth = true;
                    }, 10);
                } catch (e) {
                    await this.utils.waitForElement(`hr_ht_table_controls_${this.input.id}`);
                    tableControls.style.display = "none";
                    actionCellControl.style.opacity = "0";
                    tableControls.style.opacity = "0";
                    if (e && e.response && e.response.status === 403) {
                        this.emit("unauthorized");
                        resolve();
                    }
                    this.getComponent(`notify_ht_${this.input.id}`).show(window.__heretic.t("htable_loadingError"), "is-danger");
                    this.setState("data", []);
                    this.setState("pagination", []);
                    setTimeout(() => this.setTableDimensionsDebounced(), 10);
                } finally {
                    setTimeout(() => this.setLoading(false));
                    resolve();
                }
            }, 0);
        });
    }

    onUpdate() {
        if (this.needToUpdateTableWidth) {
            this.needToUpdateTableWidth = false;
            this.setTableDimensionsDebounced();
        }
        if (window.__heretic && window.__heretic.setTippy) {
            window.__heretic.setTippy();
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

    generateRecycleBinPagination() {
        const center = [this.state.currentRecycleBinListPage - 2, this.state.currentRecycleBinListPage - 1, this.state.currentRecycleBinListPage, this.state.currentRecycleBinListPage + 1, this.state.currentRecycleBinListPage + 2];
        const filteredCenter = center.filter((p) => p > 1 && p < this.state.recycleBinTotalPages);
        // includeThreeLeft
        if (this.state.currentRecycleBinListPage === 5) {
            filteredCenter.unshift(2);
        }
        // includeThreeRight
        if (this.state.currentRecycleBinListPage === this.state.recycleBinTotalPages - 4) {
            filteredCenter.push(this.state.recycleBinTotalPages - 1);
        }
        // includeLeftDots
        if (this.state.currentRecycleBinListPage > 5) {
            filteredCenter.unshift("...");
        }
        // includeRightDots
        if (this.state.currentRecycleBinListPage < this.state.recycleBinTotalPages - 4) {
            filteredCenter.push("...");
        }
        // Finalize
        const pagination = [1, ...filteredCenter, this.state.recycleBinTotalPages];
        if (pagination.join(",") === "1,1") {
            pagination.pop();
        }
        // Set pagination
        this.setState("recycleBinPagination", pagination);
    }

    onPageClick(page) {
        this.setState("selected", 0);
        this.setState("checkboxes", []);
        this.setState("checkboxesAll", false);
        this.loadData({
            currentPage: parseInt(page, 10),
        });
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
        if (id === "delete" && this.state.deleteConfig && this.state.checkboxes.length) {
            await this.utils.waitForComponent(`deleteConfirmation_ht_${this.input.id}`);
            const deleteConfirmation = this.getComponent(`deleteConfirmation_ht_${this.input.id}`);
            const deleteItems = [];
            for (const itemId of this.state.checkboxes) {
                deleteItems.push({
                    id: itemId,
                    title: String(this.state.data.find(i => i._id === itemId)[this.state.deleteConfig.titleId] || itemId),
                });
            }
            this.setState("deleteItems", deleteItems);
            deleteConfirmation.setActive(true).setCloseAllowed(true).setLoading(false);
        } else if (id === "delete" && this.state.deleteConfig && !this.state.checkboxes.length) {
            this.getComponent(`notify_ht_${this.input.id}`).show(window.__heretic.t("htable_nothingSelected"), "is-warning");
        }
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
            await this.utils.waitForComponent(`deleteConfirmation_ht_${this.input.id}`);
            const deleteConfirmation = this.getComponent(`deleteConfirmation_ht_${this.input.id}`);
            const deleteItems = [{
                id: itemId,
                title: String(this.state.data.find(i => i._id === itemId)[this.state.deleteConfig.titleId] || itemId),
            }];
            this.setState("deleteItems", deleteItems);
            deleteConfirmation.setActive(true).setCloseAllowed(true).setLoading(false);
        }
    }

    onCheckboxSelectAllClick(e) {
        e.preventDefault();
        if (e.target.checked) {
            const checkboxes = [];
            for (const item of this.state.data) {
                checkboxes.push(item._id);
            }
            this.setState("checkboxes", checkboxes);
        } else {
            this.setState("checkboxes", []);
        }
        this.setState("selected", this.state.checkboxes.length);
        this.setState("checkboxesAll", !!e.target.checked);
    }

    onCheckboxClick(e) {
        e.preventDefault();
        let checkboxes = cloneDeep(this.state.checkboxes);
        const {
            id
        } = e.target.closest("[data-id]").dataset;
        if (e.target.checked) {
            checkboxes.push(id);
        } else if (!e.target.checked) {
            checkboxes = this.state.checkboxes.filter(i => i !== id);
        }
        const checkboxesUnique = [
            ...new Set(checkboxes)
        ];
        this.setState("selected", checkboxesUnique.length);
        this.setState("checkboxes", checkboxesUnique);
        this.setState("checkboxesAll", checkboxesUnique.length === this.state.data.length);
    }

    async onDeleteConfirmationButtonClick(id) {
        switch (id) {
        case "delete":
            await this.utils.waitForComponent(`deleteConfirmation_ht_${this.input.id}`);
            const deleteConfirmation = this.getComponent(`deleteConfirmation_ht_${this.input.id}`);
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
                this.setState("checkboxes", []);
                this.setState("selected", 0);
                this.setState("checkboxesAll", false);
                await this.loadData({
                    currentPage: 1,
                });
                deleteConfirmation.setCloseAllowed(true).setLoading(false).setActive(false);
                this.getComponent(`notify_ht_${this.input.id}`).show(`${window.__heretic.t("htable_deleteSuccess")}: ${deleteResult.data.count}`, "is-success");
            } catch {
                this.getComponent(`notify_ht_${this.input.id}`).show(window.__heretic.t("htable_deleteError"), "is-danger");
                deleteConfirmation.setCloseAllowed(true).setLoading(false);
            }
            break;
        }
    }

    getColumnsData() {
        return this.state.columnData;
    }

    onReloadClick(e) {
        e.preventDefault();
        this.loadData();
    }

    onSearchInputChange(e) {
        const value = e.target.value.trim();
        this.setState("searchText", value);
        this.loadDataDebounced({
            searchText: value,
            currentPage: 1,
            focusOnSearch: true,
        });
    }

    async onSettingsClick(e) {
        e.preventDefault();
        await this.utils.waitForComponent(`settingsModal_ht_${this.input.id}`);
        const settingsModal = this.getComponent(`settingsModal_ht_${this.input.id}`);
        this.setState("settingsColumns", cloneDeep(this.state.columns));
        this.setState("settingsTab", "columns");
        this.setState("settingsItemsPerPage", this.state.itemsPerPage);
        const settingsFilter = cloneDeep(this.state.filters).map(i => ({
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

    async saveSettings() {
        await this.utils.waitForComponent(`settingsModal_ht_${this.input.id}`);
        const settingsModal = this.getComponent(`settingsModal_ht_${this.input.id}`);
        let count = 0;
        for (const k of Object.keys(this.state.settingsColumns)) {
            count += this.state.settingsColumns[k] ? 1 : 0;
        }
        if (!count) {
            this.setState("settingsTab", "columns");
            this.getComponent(`notify_ht_${this.input.id}`).show(window.__heretic.t("htable_noColumnsSelected"), "is-warning");
            return;
        }
        this.setState("columns", cloneDeep(this.state.settingsColumns));
        this.store.remove("ratios");
        this.store.set("columns", this.state.columns);
        this.setState("settingsTab", "pages");
        await this.utils.waitForComponent(`settingsPagesForm_${this.input.id}`);
        const settingsPagesForm = this.getComponent(`settingsPagesForm_${this.input.id}`);
        const pagesFormData = settingsPagesForm.process();
        if (!pagesFormData) {
            return;
        }
        const loadInput = {};
        if (this.state.itemsPerPage !== pagesFormData.formTabs._default.itemsPerPage) {
            loadInput.currentPage = 1;
            this.store.set("itemsPerPage", parseInt(pagesFormData.formTabs._default.itemsPerPage, 10));
        }
        this.setState("itemsPerPage", pagesFormData.formTabs._default.itemsPerPage);
        const filters = cloneDeep(this.state.settingsFilters).map(item => ({
            enabled: item.enabled,
            id: item.id,
            mode: item.mode,
            value: item.value,
        }));
        this.setState("filters", filters);
        this.store.set("filters", this.state.settingsFilters);
        this.setState("filtersEnabledCount", this.state.filters.reduce((a, c) => a += c.enabled ? 1 : 0, 0));
        // Close modal
        settingsModal.setActive(false).setCloseAllowed(true).setBackgroundCloseAllowed(false).setLoading(false);
        this.resetColumnWidths();
        this.loadData(loadInput);
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

    onSettingsColumnUpClick(e) {
        e.preventDefault();
        const {
            id
        } = e.target.closest("[data-id]").dataset;
        const settingsColumns = {};
        const settingsColumnsArr = Object.keys(this.state.settingsColumns);
        const currentIndex = settingsColumnsArr.findIndex(i => i === id);
        if (currentIndex > 0) {
            [settingsColumnsArr[currentIndex], settingsColumnsArr[currentIndex - 1]] = [settingsColumnsArr[currentIndex - 1], settingsColumnsArr[currentIndex]];
            for (const c of settingsColumnsArr) {
                settingsColumns[c] = this.state.settingsColumns[c];
            }
            this.setState("settingsColumns", settingsColumns);
        }
    }

    onSettingsColumnDownClick(e) {
        e.preventDefault();
        const {
            id
        } = e.target.closest("[data-id]").dataset;
        const settingsColumns = {};
        const settingsColumnsArr = Object.keys(this.state.settingsColumns);
        const currentIndex = settingsColumnsArr.findIndex(i => i === id);
        if (currentIndex < settingsColumnsArr.length) {
            [settingsColumnsArr[currentIndex], settingsColumnsArr[currentIndex + 1]] = [settingsColumnsArr[currentIndex + 1], settingsColumnsArr[currentIndex]];
            for (const c of settingsColumnsArr) {
                settingsColumns[c] = this.state.settingsColumns[c];
            }
            this.setState("settingsColumns", settingsColumns);
        }
    }

    onSettingsColumnDragStart(e) {
        const {
            id
        } = e.target.closest("[data-id]").dataset;
        this.setState("settingColumnDrag", id);
        e.dataTransfer.setData("text", this.input.id);
        return true;
    }

    onSettingsColumnDragEnd() {
        this.setState("settingColumnDrag", null);
        return true;
    }

    onSettingsColumnDragEnter(e) {
        e.preventDefault();
        e.target.classList.add("hr-ht-settings-columns-drop-area-over");
    }

    onSettingsColumnDragLeave(e) {
        e.preventDefault();
        e.target.classList.remove("hr-ht-settings-columns-drop-area-over");
    }

    onSettingsColumnDragOver(e) {
        e.preventDefault();
        e.target.classList.add("hr-ht-settings-columns-drop-area-over");
    }

    onSettingsColumnDrop(e) {
        const dataTransfer = e.dataTransfer.getData("text");
        e.target.classList.remove("hr-ht-settings-columns-drop-area-over");
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

    onSettingsPagesFormSubmit() {
        this.saveSettings();
    }

    getFormData() {
        return this.input.formData;
    }

    getFirstFilterableColumn() {
        for (const item of Object.keys(this.state.columnData)) {
            if (this.state.settingsFilterTypes.indexOf(this.state.columnData[item].type) > -1) {
                return item;
            }
        }
        return null;
    }

    getFirstBulkUpdateColumn() {
        for (const item of Object.keys(this.state.columnData)) {
            if (this.state.bulkItemTypes.indexOf(this.state.columnData[item].type) > -1) {
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
        default:
            modes = [];
        }
        this.setState("settingsFilterEditSelectedModes", modes);
    }

    async settingsSetFilterData(id) {
        switch (this.state.columnData[id].type) {
        case "select":
            await this.utils.waitForComponent(`filterModal_ht_${this.input.id}_hselect`);
            const hSelect = this.getComponent(`filterModal_ht_${this.input.id}_hselect`);
            const items = {};
            this.state.columnData[id].options.map(i => items[i.value] = i.label);
            hSelect.setItems(items);
            break;
        }
    }

    async bulkUpdateData(id) {
        switch (this.state.columnData[id].type) {
        case "select":
            const bulkItemEditSelectValues = this.state.columnData[id].options.map(i => ({
                value: i.value,
                label: i.label,
            }));
            this.setState("bulkItemEditSelectValues", bulkItemEditSelectValues);
            break;
        }
    }

    async settingsSetValue(id, value) {
        switch (this.state.columnData[id].type) {
        case "select":
            await this.utils.waitForComponent(`filterModal_ht_${this.input.id}_hselect`);
            this.getComponent(`filterModal_ht_${this.input.id}_hselect`).setSelected(value);
            break;
        case "date":
            await this.utils.waitForComponent(`filterModal_ht_${this.input.id}_hcalendar`);
            this.getComponent(`filterModal_ht_${this.input.id}_hcalendar`).setTimestamp(value ? value * 1000 : new Date().getTime());
            break;
        default:
            this.setState("settingsFilterEditSelectedValue", value);
        }
    }

    async bulkSetValue(id, value) {
        switch (this.state.columnData[id].type) {
        case "date":
            await this.utils.waitForComponent(`bulkItem_ht_${this.input.id}_hcalendar`);
            this.getComponent(`bulkItem_ht_${this.input.id}_hcalendar`).setTimestamp(value ? value * 1000 : new Date().getTime());
            break;
        default:
            this.setState("bulkItemSelectedValue", value);
        }
    }

    async settingsNewFilter(e) {
        e.preventDefault();
        await this.utils.waitForComponent(`filterModal_ht_${this.input.id}`);
        const filterModal = this.getComponent(`filterModal_ht_${this.input.id}`);
        this.setState("settingsFilterUID", null);
        filterModal.setActive(true).setCloseAllowed(true).setBackgroundCloseAllowed(false).setLoading(false);
        const firstColumn = this.getFirstFilterableColumn();
        this.setState("settingsFilterEditSelectedId", firstColumn);
        this.setState("settingsFilterEditSelectedValue", null);
        this.setSettingsFilterModesState(this.state.columnData[firstColumn].type);
        if (this.state.settingsFilterEditSelectedModes.length) {
            this.setState("settingsFilterEditSelectedMode", this.state.settingsFilterEditSelectedModes[0]);
        }
        await this.utils.waitForElement(`filterModal_ht_${this.input.id}_body`);
        await this.settingsSetFilterData(firstColumn);
        await this.utils.waitForElement(`filterModal_ht_${this.input.id}_select_id`);
        document.getElementById(`filterModal_ht_${this.input.id}_select_id`).focus();
    }

    async onSettingsFilterEditSelectedChange(e) {
        e.preventDefault();
        this.setState("settingsFilterEditSelectedId", e.target.value);
        this.setSettingsFilterModesState(this.state.columnData[e.target.value].type);
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

    async saveFilter() {
        const id = this.state.settingsFilterEditSelectedId;
        const mode = this.state.settingsFilterEditSelectedMode;
        let value;
        switch (this.state.columnData[id].type) {
        case "select":
            await this.utils.waitForComponent(`filterModal_ht_${this.input.id}_hselect`);
            value = this.getComponent(`filterModal_ht_${this.input.id}_hselect`).getSelected();
            break;
        case "date":
            await this.utils.waitForComponent(`filterModal_ht_${this.input.id}_hcalendar`);
            value = this.getComponent(`filterModal_ht_${this.input.id}_hcalendar`).getTimestamp();
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
        await this.utils.waitForComponent(`filterModal_ht_${this.input.id}`);
        this.getComponent(`filterModal_ht_${this.input.id}`).setActive(false);
    }

    onFilterButtonClick(button) {
        switch (button) {
        case "save":
            this.saveFilter();
            break;
        }
    }

    async onSettingsFilterEditClick(e) {
        e.preventDefault();
        const {
            uid,
        } = e.target.closest("[data-uid]").dataset;
        const settingsFilter = this.state.settingsFilters.find(i => i.uid === uid);
        const filterModal = this.getComponent(`filterModal_ht_${this.input.id}`);
        filterModal.setActive(true).setCloseAllowed(true).setBackgroundCloseAllowed(false).setLoading(false);
        this.setState("settingsFilterUID", uid);
        this.setState("settingsFilterEditSelectedId", settingsFilter.id);
        this.setSettingsFilterModesState(this.state.columnData[settingsFilter.id].type);
        if (this.state.settingsFilterEditSelectedModes.length) {
            this.setState("settingsFilterEditSelectedMode", settingsFilter.mode);
        }
        await this.settingsSetFilterData(settingsFilter.id);
        this.settingsSetValue(settingsFilter.id, settingsFilter.value);
        await this.utils.waitForElement(`filterModal_ht_${this.input.id}_select_id`);
        document.getElementById(`filterModal_ht_${this.input.id}_select_id`).focus();
    }

    onSettingsFilterDeleteClick(e) {
        e.preventDefault();
        const {
            uid
        } = e.target.closest("[data-uid]").dataset;
        const settingsFilters = this.state.settingsFilters.filter(i => i.uid !== uid);
        this.setState("settingsFilters", settingsFilters);
    }

    onFilterEditFormSubmit(e) {
        e.preventDefault();
        this.saveFilter();
    }

    settingsFilterCheckboxChange(e) {
        const {
            uid
        } = e.target.closest("[data-uid]").dataset;
        const settingsFilters = cloneDeep(this.state.settingsFilters).map(item => ({
            ...item,
            enabled: item.uid === uid ? e.target.checked : item.enabled,
        }));
        this.setState("settingsFilters", settingsFilters);
    }

    onDataClick(e) {
        e.preventDefault();
        this.setState("dataOpen", true);
    }

    async setBulkItemTabs() {
        if (this.state.tabs && this.state.tabs.length) {
            await this.utils.waitForComponent(`bulkItem_ht_${this.input.id}_tabs`);
            const hTabsSelect = this.getComponent(`bulkItem_ht_${this.input.id}_tabs`);
            const items = {};
            this.state.tabs.map(i => items[i.id] = i.label || window.__heretic.t("htable_defaultTab"));
            hTabsSelect.setItems(items, this.state.tabs.map(i => i.id));
            return hTabsSelect;
        }
        return null;
    }

    async onBulkUpdateClick(e) {
        e.preventDefault();
        this.setState("dataOpen", false);
        this.setState("bulkItems", []);
        this.setState("bulkItemUID", null);
        await this.utils.waitForComponent(`bulkUpdateModal_ht_${this.input.id}`);
        const bulkUpdateModal = this.getComponent(`bulkUpdateModal_ht_${this.input.id}`);
        bulkUpdateModal.setActive(true).setCloseAllowed(true).setBackgroundCloseAllowed(false).setLoading(false);
    }

    async onBulkUpdateButtonClick(button) {
        switch (button) {
        case "save":
            await this.utils.waitForComponent(`bulkUpdateModal_ht_${this.input.id}`);
            const bulkModal = this.getComponent(`bulkUpdateModal_ht_${this.input.id}`);
            if (!this.state.bulkItems.length) {
                bulkModal.setActive(false);
                this.getComponent(`notify_ht_${this.input.id}`).show(window.__heretic.t("htable_nothingToDo"), "is-warning");
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
                    url: this.state.bulkUpdateConfig.url,
                    data: {
                        selected: this.state.checkboxes,
                        bulkItems,
                        filters: this.state.filters.filter(i => i.enabled),
                        searchText: this.state.searchText,
                    },
                    headers: this.input.headers || {},
                });
                await this.loadData();
                bulkModal.setActive(false);
            } catch (e) {
                if (e && e.response && e.response.status === 403) {
                    this.emit("unauthorized");
                }
                this.getComponent(`notify_ht_${this.input.id}`).show(window.__heretic.t("htable_loadingError"), "is-danger");
            } finally {
                bulkModal.setLoading(false).setCloseAllowed(true);
            }
            break;
        }
    }

    async bulkItemNew(e) {
        e.preventDefault();
        await this.utils.waitForComponent(`bulkItemModal_ht_${this.input.id}`);
        const bulkItemModal = this.getComponent(`bulkItemModal_ht_${this.input.id}`);
        this.setState("bulkItemUID", null);
        bulkItemModal.setActive(true).setCloseAllowed(true).setBackgroundCloseAllowed(false).setLoading(false);
        const firstColumn = this.getFirstBulkUpdateColumn();
        this.setState("bulkItemSelectedId", firstColumn);
        this.setState("bulkItemSelectedValue", null);
        await this.utils.waitForElement(`bulkItem_ht_${this.input.id}_body`);
        await this.bulkUpdateData(firstColumn);
        await this.utils.waitForElement(`bulkItem_ht_${this.input.id}_select_id`);
        await this.setBulkItemTabs();
        document.getElementById(`bulkItem_ht_${this.input.id}_select_id`).focus();
    }

    async saveBulkItem() {
        await this.utils.waitForComponent(`bulkItem_ht_${this.input.id}_tabs`);
        const tabs = this.getComponent(`bulkItem_ht_${this.input.id}_tabs`).getSelected();
        const id = this.state.bulkItemSelectedId;
        let value;
        switch (this.state.columnData[id].type) {
        case "date":
            await this.utils.waitForComponent(`bulkItem_ht_${this.input.id}_hcalendar`);
            value = this.getComponent(`bulkItem_ht_${this.input.id}_hcalendar`).getTimestamp();
            break;
        default:
            value = this.state.bulkItemSelectedValue;
        }
        const bulkItems = cloneDeep(this.state.bulkItems);
        for (const item of bulkItems) {
            if (this.state.bulkItemUID !== item.uid && item.id === id) {
                for (const tab of tabs) {
                    if (item.tabs.indexOf(tab) > -1) {
                        await this.utils.waitForComponent(`notify_ht_${this.input.id}`);
                        this.getComponent(`notify_ht_${this.input.id}`).show(window.__heretic.t("htable_duplicateBulkItem"), "is-warning");
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
        await this.utils.waitForComponent(`bulkItemModal_ht_${this.input.id}`);
        this.getComponent(`bulkItemModal_ht_${this.input.id}`).setActive(false);
    }

    onBulkItemButtonClick(button) {
        switch (button) {
        case "save":
            this.saveBulkItem();
            break;
        }
    }

    onBulkItemFormSubmit(e) {
        e.preventDefault();
        this.saveBulkItem();
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

    onBulkItemSelectChange(e) {
        e.preventDefault();
        this.setState("bulkItemSelectedValue", e.target.value);
    }

    async onBulkItemEditClick(e) {
        e.preventDefault();
        const {
            uid,
        } = e.target.closest("[data-uid]").dataset;
        const bulkItem = this.state.bulkItems.find(i => i.uid === uid);
        const bulkModal = this.getComponent(`bulkItemModal_ht_${this.input.id}`);
        bulkModal.setActive(true).setCloseAllowed(true).setBackgroundCloseAllowed(false).setLoading(false);
        this.setState("bulkItemUID", uid);
        this.setState("bulkItemSelectedId", bulkItem.id);
        await this.bulkUpdateData(bulkItem.id);
        this.bulkSetValue(bulkItem.id, bulkItem.value);
        await this.utils.waitForElement(`bulkItem_ht_${this.input.id}_select_id`);
        const bulkTabs = await this.setBulkItemTabs();
        if (bulkTabs) {
            bulkTabs.setSelected(bulkItem.tabs);
        }
        document.getElementById(`bulkItem_ht_${this.input.id}_select_id`).focus();
    }

    onBulkItemDeleteClick(e) {
        e.preventDefault();
        const {
            uid
        } = e.target.closest("[data-uid]").dataset;
        const bulkItems = this.state.bulkItems.filter(i => i.uid !== uid);
        this.setState("bulkItems", bulkItems);
    }

    async onExportClick(e) {
        e.preventDefault();
        if (!this.state.checkboxes.length) {
            this.setState("dataOpen", false);
            this.getComponent(`notify_ht_${this.input.id}`).show(window.__heretic.t("htable_exportNoneSelectedError"), "is-warning");
            return;
        }
        await this.utils.waitForComponent(`exportModal_ht_${this.input.id}`);
        const exportModal = this.getComponent(`exportModal_ht_${this.input.id}`);
        this.setState("dataExportUID", null);
        this.setState("dataExportColumns", cloneDeep(this.state.columns));
        exportModal.setActive(true).setCloseAllowed(true).setBackgroundCloseAllowed(true).setLoading(false);
    }

    async onExportButtonClick(button) {
        switch (button) {
        case "save":
            const {
                value
            } = document.getElementById(`export_ht_${this.input.id}_format`);
            const exportModal = this.getComponent(`exportModal_ht_${this.input.id}`);
            exportModal.setCloseAllowed(false).setLoading(true);
            try {
                const response = await axios({
                    method: "post",
                    url: this.state.exportConfig.url,
                    data: {
                        format: value,
                        selected: this.state.checkboxes,
                        columns: Object.keys(this.state.dataExportColumns).filter(i => this.state.dataExportColumns[i]),
                        language: this.language,
                    },
                    headers: this.input.headers || {},
                });
                this.setState("dataExportUID", response.data.uid);
                exportModal.setActive(false);
                await this.utils.waitForComponent(`exportDownloadModal_ht_${this.input.id}`);
                const exportDownloadModal = this.getComponent(`exportDownloadModal_ht_${this.input.id}`);
                exportDownloadModal.setActive(true).setCloseAllowed(true).setBackgroundCloseAllowed(true).setLoading(false);
            } catch (e) {
                exportModal.setCloseAllowed(true).setLoading(false);
                if (e && e.response && e.response.status === 403) {
                    this.emit("unauthorized");
                }
                this.getComponent(`notify_ht_${this.input.id}`).show(window.__heretic.t("htable_exportError"), "is-danger");
            }
            break;
        }
    }

    onExportDownloadButtonClick() {}

    onExportColumnDragOver(e) {
        e.preventDefault();
        e.target.classList.add("hr-ht-export-columns-drop-area-over");
    }

    onExportColumnDragEnter(e) {
        e.preventDefault();
        e.target.classList.add("hr-ht-export-columns-drop-area-over");
    }

    onExportColumnDragLeave(e) {
        e.preventDefault();
        e.target.classList.remove("hr-ht-export-columns-drop-area-over");
    }

    onExportColumnDrop(e) {
        const dataTransfer = e.dataTransfer.getData("text");
        e.target.classList.remove("hr-ht-export-columns-drop-area-over");
        if (dataTransfer === this.input.id) {
            const {
                id
            } = e.target.closest("[data-id]").dataset;
            const dataExportColumns = {};
            const dataExportColumnsArr = Object.keys(this.state.dataExportColumns).filter(i => i !== this.state.exportColumnDrag);
            const newIndex = dataExportColumnsArr.findIndex(i => i === id);
            dataExportColumnsArr.splice(newIndex, 0, this.state.exportColumnDrag);
            for (const c of dataExportColumnsArr) {
                dataExportColumns[c] = this.state.dataExportColumns[c];
            }
            this.setState("dataExportColumns", dataExportColumns);
            return true;
        }
    }

    onExportColumnDragStart(e) {
        const {
            id
        } = e.target.closest("[data-id]").dataset;
        this.setState("exportColumnDrag", id);
        e.dataTransfer.setData("text", this.input.id);
        return true;
    }

    onExportColumnDragEnd() {
        this.setState("exportColumnDrag", null);
        return true;
    }

    onExportColumnCheckboxClick(e) {
        e.preventDefault();
        const {
            checked
        } = e.target;
        const {
            id
        } = e.target.dataset;
        const dataExportColumns = cloneDeep(this.state.dataExportColumns);
        dataExportColumns[id] = checked;
        this.setState("dataExportColumns", dataExportColumns);
    }

    onExportColumnUpClick(e) {
        e.preventDefault();
        const {
            id
        } = e.target.closest("[data-id]").dataset;
        const dataExportColumns = {};
        const dataExportColumnsArr = Object.keys(this.state.dataExportColumns);
        const currentIndex = dataExportColumnsArr.findIndex(i => i === id);
        if (currentIndex > 0) {
            [dataExportColumnsArr[currentIndex], dataExportColumnsArr[currentIndex - 1]] = [dataExportColumnsArr[currentIndex - 1], dataExportColumnsArr[currentIndex]];
            for (const c of dataExportColumnsArr) {
                dataExportColumns[c] = this.state.dataExportColumns[c];
            }
            this.setState("dataExportColumns", dataExportColumns);
        }
    }

    onExportColumnDownClick(e) {
        e.preventDefault();
        const {
            id,
        } = e.target.closest("[data-id]").dataset;
        const dataExportColumns = {};
        const dataExportColumnsArr = Object.keys(this.state.dataExportColumns);
        const currentIndex = dataExportColumnsArr.findIndex(i => i === id);
        if (currentIndex < dataExportColumnsArr.length) {
            [dataExportColumnsArr[currentIndex], dataExportColumnsArr[currentIndex + 1]] = [dataExportColumnsArr[currentIndex + 1], dataExportColumnsArr[currentIndex]];
            for (const c of dataExportColumnsArr) {
                dataExportColumns[c] = this.state.dataExportColumns[c];
            }
            this.setState("dataExportColumns", dataExportColumns);
        }
    }

    onRecycleBinButtonClick() {}

    async loadRecycleBinData(input = {
        page: this.state.currentRecycleBinListPage,
    }) {
        await this.utils.waitForComponent(`recycleBinModal_ht_${this.input.id}`);
        const recycleBinModal = this.getComponent(`recycleBinModal_ht_${this.input.id}`);
        recycleBinModal.setActive(true).setCloseAllowed(false).setBackgroundCloseAllowed(true).setLoading(true);
        try {
            const response = await axios({
                method: "post",
                url: this.state.recycleBin.url.list,
                data: {
                    itemsPerPage: this.state.itemsPerPage,
                    page: input.page,
                },
                headers: this.input.headers || {},
            });
            this.setState("recycleBinList", response.data.items);
            this.setState("recycleBinTotalPages", response.data.total < this.state.itemsPerPage ? 1 : Math.ceil(response.data.total / this.state.itemsPerPage));
            if (input.page !== this.state.currentRecycleBinListPage) {
                this.setState("currentRecycleBinListPage", input.page);
            }
            this.generateRecycleBinPagination();
        } catch (e) {
            if (e && e.response && e.response.status === 403) {
                this.emit("unauthorized");
                return;
            }
            this.getComponent(`notify_ht_${this.input.id}`).show(window.__heretic.t("htable_loadingError"), "is-danger");
            this.setState("recycleBinList", []);
        } finally {
            recycleBinModal.setLoading(false).setCloseAllowed(true);
        }
    }

    async onRecycleBinClick(event) {
        event.preventDefault();
        this.setState("currentRecycleBinListPage", 1);
        this.setState("recycleBinList", []);
        await this.loadRecycleBinData();
    }

    onRecycleBinPageClick(pageStr) {
        const page = parseInt(pageStr, 10);
        if (page === this.state.currentRecycleBinListPage) {
            return;
        }
        this.loadRecycleBinData({
            page,
        });
    }

    async onRecycleBinRestoreClick(event) {
        event.preventDefault();
        const {
            id,
        } = event.target.closest("[data-id]").dataset;
        await this.utils.waitForComponent(`recycleBinModal_ht_${this.input.id}`);
        const recycleBinModal = this.getComponent(`recycleBinModal_ht_${this.input.id}`);
        recycleBinModal.setActive(true).setCloseAllowed(false).setLoading(true);
        try {
            const restoreResult = await axios({
                method: "post",
                url: this.state.recycleBin.url.restore,
                data: {
                    ids: [id],
                },
                headers: this.input.headers || {},
            });
            await this.loadRecycleBinData({
                page: 1
            });
            await this.loadData();
            this.getComponent(`notify_ht_${this.input.id}`).show(`${window.__heretic.t("htable_restoreSuccess")}: ${restoreResult.data.count}`, "is-success");
        } catch (e) {
            if (e && e.response && e.response.status === 403) {
                this.emit("unauthorized");
                return;
            }
            this.getComponent(`notify_ht_${this.input.id}`).show(window.__heretic.t("htable_loadingError"), "is-danger");
        } finally {
            recycleBinModal.setLoading(false).setCloseAllowed(true);
        }
    }

    async onRecycleBinDeleteClick(e) {
        e.preventDefault();
        const {
            id,
        } = e.target.closest("[data-id]").dataset;
        const recycleDeleteItems = [];
        const title = this.state.recycleBinList.find(i => i._id === id)[this.state.recycleBin.title];
        recycleDeleteItems.push({
            id,
            title,
        });
        this.setState("recycleDeleteItems", recycleDeleteItems);
        await this.utils.waitForComponent(`deleteRecycleConfirmation_ht_${this.input.id}`);
        const deleteConfirmation = this.getComponent(`deleteRecycleConfirmation_ht_${this.input.id}`);
        deleteConfirmation.setActive(true).setCloseAllowed(true).setLoading(false);
    }

    async onDeleteRecycleConfirmationButtonClick(button) {
        switch (button) {
        case "delete":
            await this.utils.waitForComponent(`deleteRecycleConfirmation_ht_${this.input.id}`);
            const deleteConfirmation = this.getComponent(`deleteRecycleConfirmation_ht_${this.input.id}`);
            deleteConfirmation.setCloseAllowed(false).setLoading(true);
            try {
                const deleteResult = await axios({
                    method: "post",
                    url: this.state.recycleBin.url.delete,
                    data: {
                        ids: this.state.recycleDeleteItems.map(i => i.id),
                    },
                    headers: this.input.headers || {},
                });
                await this.loadRecycleBinData({
                    page: 1
                });
                await this.loadData();
                deleteConfirmation.setActive(false);
                this.getComponent(`notify_ht_${this.input.id}`).show(`${window.__heretic.t("htable_deleteSuccess")}: ${deleteResult.data.count}`, "is-success");
            } catch (e) {
                if (e && e.response && e.response.status === 403) {
                    this.emit("unauthorized");
                    return;
                }
                this.getComponent(`notify_ht_${this.input.id}`).show(window.__heretic.t("htable_loadingError"), "is-danger");
            } finally {
                deleteConfirmation.setLoading(false).setCloseAllowed(true);
            }
            break;
        }
    }

    setLock(id, username) {
        const lockedItems = cloneDeep(this.state.lockedItems);
        if (username) {
            lockedItems[id] = username;
        } else {
            delete lockedItems[id];
        }
        this.setStateDirty("lockedItems", lockedItems);
        if (window.__heretic && window.__heretic.setTippy) {
            window.__heretic.setTippy();
        }
    }

    onSearchButtonClearClick(e) {
        e.preventDefault();
        if (this.state.searchText && this.state.searchText.length) {
            this.setState("searchText", "");
            this.loadDataDebounced({
                searchText: "",
                currentPage: 1,
                focusOnSearch: true,
            });
        }
    }
};
