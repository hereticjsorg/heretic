const store = require("store2");
const axios = require("axios");
const cloneDeep = require("lodash.clonedeep");
const Utils = require("../../lib/componentUtils").default;

module.exports = class {
    onCreate(input) {
        this.defaultSortData = input.formData.getTableDefaultSortColumn ? input.formData.getTableDefaultSortColumn() : {};
        this.state = {
            columnData: input.formData.getTableColumns(),
            sortField: this.defaultSortData.id || null,
            sortDirection: this.defaultSortData.direction || null,
            actionColumn: input.formData.isActionColumn(),
            checkboxColumn: input.formData.isCheckboxColumn(),
            actions: input.formData.getActions(),
            topButtons: input.formData.getTopButtons(),
            data: [],
            loading: false,
            currentPage: 1,
            totalPages: 1,
            itemsPerPage: 30,
            pagination: [],
            checkboxes: [],
            checkboxesAll: false,
            dataDelete: [],
            deleteConfig: input.formData.getTableLoadConfig ? input.formData.getTableDeleteConfig() : null,
            deleteItems: [],
        };
    }

    getElements() {
        const elementWrap = document.getElementById(`hr_ht_wrap_${this.input.id}`);
        const elementTableControls = document.getElementById(`hr_ht_table_controls_${this.input.id}`);
        const elementDummy = document.getElementById(`hr_ht_dummy_${this.input.id}`);
        const elementTableContainer = document.getElementById(`hr_ht_table_container_${this.input.id}`);
        const elementTable = document.getElementById(`hr_ht_table_${this.input.id}`);
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
        return {
            elementWrap,
            elementTableControls,
            elementDummy,
            elementTableContainer,
            elementTable,
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
        const {
            elementWrap,
            elementTableControls,
            elementDummy
        } = this.getElements();
        if (!elementWrap || !elementTableControls || !elementDummy) {
            return 0;
        }
        const elementWrapDisplay = elementWrap.style.display;
        const tableControlsDisplay = elementTableControls.style.display;
        elementWrap.style.display = "none";
        elementTableControls.style.display = "none";
        elementDummy.style.display = "block";
        const dummyRect = elementDummy.getBoundingClientRect();
        elementWrap.style.display = elementWrapDisplay;
        elementTableControls.style.display = tableControlsDisplay;
        elementDummy.style.display = "none";
        return dummyRect.width;
    }

    setTableWidth() {
        const {
            elementTable,
            elementTableContainer,
            elementWrap,
        } = this.getElements();
        if (!elementTable || !elementTableContainer || !elementWrap) {
            return;
        }
        this.resetColumnWidths();
        this.tableContainerWidth = this.getCurrentTableWidth();
        elementTableContainer.style.width = `${this.tableContainerWidth}px`;
        elementWrap.style.width = `${this.tableContainerWidth}px`;
        elementTable.style.width = `${this.tableContainerWidth}px`;
        const elementTableWidth = elementTable.getBoundingClientRect().width;
        elementTable.style.width = `${elementTableWidth}px`;
        const elementScrollWrapper = document.getElementById(`hr_ht_table_scroll_wrapper_${this.input.id}`);
        if (this.tableContainerWidth < elementTableWidth) {
            const elementScroll = document.getElementById(`hr_ht_table_scroll_${this.input.id}`);
            elementScroll.style.width = `${elementTableWidth}px`;
            elementScrollWrapper.style.width = `${this.tableContainerWidth}px`;
            elementScrollWrapper.style.display = "block";
        } else {
            elementScrollWrapper.style.display = "none";
        }
        this.restoreWidthFromSavedRatios();
        this.placeStickyElements();
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

    async setLoading(flag) {
        if (flag) {
            this.setState("loading", true);
            await this.utils.waitForElement(`hr_ht_loading_${this.input.id}`);
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

    placeStickyElements() {
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
        // Calculate and set "Actions" column width
        if (!this.actionColumnWidth) {
            if (firstActionCell.getBoundingClientRect().width >= actionsTh.getBoundingClientRect().width) {
                this.actionColumnWidth = firstActionCell.getBoundingClientRect().width;
            } else {
                this.actionColumnWidth = actionsTh.getBoundingClientRect().width;
            }
        }
        actionsColumns.style.width = `${this.actionColumnWidth}px`;
        actionsTh.style.width = `${this.actionColumnWidth}px`;
        for (const actionCellWrap of actionCellWraps) {
            setTimeout(async () => {
                await this.utils.waitForElement(`hr_ht_action_cell_${this.input.id}_${actionCellWrap.dataset.index}`);
                const actionElement = document.getElementById(`hr_ht_action_cell_${this.input.id}_${actionCellWrap.dataset.index}`);
                actionCellWrap.style.height = "unset";
                actionElement.style.height = "unset";
                const actionColumnHeight = actionElement.getBoundingClientRect().height >= actionCellWrap.getBoundingClientRect().height ? actionElement.getBoundingClientRect().height : actionCellWrap.getBoundingClientRect().height;
                actionCellWrap.style.height = `${actionColumnHeight}px`;
                actionElement.style.width = `${this.actionColumnWidth + 2}px`;
                actionElement.style.height = `${actionColumnHeight - 2}px`;
                actionElement.style.top = `${actionCellWrap.getBoundingClientRect().top - mainWrap.getBoundingClientRect().top + 1}px`;
                actionElement.style.opacity = "1";
            }, 0);
        }
        tableControls.style.width = `${this.actionColumnWidth + 2}px`;
        tableControls.style.height = `${table.getBoundingClientRect().height}px`;
        tableControls.style.left = `${mainWrap.getBoundingClientRect().width - this.actionColumnWidth - 2}px`;
        actionCellControl.style.width = `${this.actionColumnWidth + 2}px`;
        actionCellControl.style.height = `${actionsTh.getBoundingClientRect().height - 1}px`;
        this.onTableContainerScroll();
    }

    async onMount() {
        this.utils = new Utils(this);
        this.store = store.namespace(`heretic_htable_${this.input.id}`);
        window.addEventListener("resize", this.setTableWidth.bind(this));
        window.addEventListener("mouseup", this.onColumnMouseUp.bind(this));
        this.restoreWidthFromSavedRatios();
        window.dispatchEvent(new CustomEvent("resize"));
        const scrollWrapper = document.getElementById(`hr_ht_table_scroll_wrapper_${this.input.id}`);
        const tableContainer = document.getElementById(`hr_ht_table_container_${this.input.id}`);
        if (scrollWrapper && tableContainer) {
            scrollWrapper.addEventListener("scroll", this.onScrollWrapScroll.bind(this));
            tableContainer.addEventListener("scroll", this.onTableContainerScroll.bind(this));
        }
        tableContainer.dispatchEvent(new CustomEvent("scroll"));
        await this.loadData();
    }

    onColumnMouseDown(e) {
        e.preventDefault();
        e.stopPropagation();
        this.columnResizing = e.target.dataset.id;
        this.prevColumn = Object.keys(this.state.columnData)[Object.keys(this.state.columnData).findIndex(i => i === this.columnResizing) - 1];
        this.moveStartX = e.touches ? e.touches[0].pageX : e.pageX;
    }

    getColumnWidths() {
        const widths = {};
        for (const c of Object.keys(this.state.columnData)) {
            const columnRect = document.getElementById(`hr_ht_column_${c}`).getBoundingClientRect();
            widths[c] = columnRect.width;
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

    resetColumnWidths() {
        for (const c of Object.keys(this.state.columnData)) {
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
        Object.keys(this.state.columnData).map(k => columnRatios[k] = parseFloat(widths[k] / this.tableContainerWidth));
        return columnRatios;
    }

    columnRatiosToWidths(ratios) {
        const widths = {};
        Object.keys(ratios).map(k => widths[k] = parseFloat(ratios[k] * this.tableContainerWidth));
        return widths;
    }

    onColumnMove(e) {
        if (!this.columnResizing) {
            return;
        }
        e.stopPropagation();
        const oldColumnWidths = this.getColumnWidths();
        const ox = e.touches ? e.touches[0].pageX : e.pageX;
        const currentMover = document.getElementById(`hr_ht_mover_${this.columnResizing}`);
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
        for (const column of Object.keys(this.state.columnData)) {
            if (column !== this.prevColumn && column !== this.columnResizing && newColumnWidths[column] !== oldColumnWidths[column]) {
                this.setColumnWidths(oldColumnWidths);
                return;
            }
        }
        this.store.set("ratios", this.columnWidthsToRatios(newColumnWidths));
        this.placeStickyElements();
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

    loadData(input = {}) {
        if (this.state.loading) {
            return;
        }
        return new Promise((resolve) => {
            const loadConfig = this.input.formData.getTableLoadConfig();
            if (!loadConfig || !loadConfig.url) {
                return;
            }
            setTimeout(async () => {
                await this.setLoading(true);
                try {
                    const response = await axios({
                        method: "post",
                        url: loadConfig.url,
                        data: {
                            fields: Object.keys(this.state.columnData),
                            sortField: input.sortField || this.state.sortField,
                            sortDirection: input.sortDirection || this.state.sortDirection,
                            itemsPerPage: this.state.itemsPerPage,
                            page: input.page || this.state.currentPage,
                        },
                        headers: {},
                    });
                    this.setState("data", response.data.items);
                    this.setState("totalPages", response.data.total < this.state.itemsPerPage ? 1 : Math.ceil(response.data.total / this.state.itemsPerPage));
                    if (input.page) {
                        this.setState("currentPage", parseInt(input.page, 10));
                    }
                    this.generatePagination();
                    this.setTableWidth();
                    this.needToUpdateTableWidth = true;
                } catch {
                    this.getComponent(`notify_ht_${this.input.id}`).show(window.__heretic.t("htable_loadingError"), "is-danger");
                    this.setState("data", []);
                } finally {
                    this.setLoading(false);
                    resolve();
                }
            }, 0);
        });
    }

    onUpdate() {
        if (this.needToUpdateTableWidth) {
            this.needToUpdateTableWidth = false;
            this.setTableWidth();
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

    onPageClick(page) {
        this.loadData({
            page: parseInt(page, 10),
        });
    }

    async onTopButtonClick(e) {
        e.preventDefault();
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
        } else if (this.state.deleteConfig && !this.state.checkboxes.length) {
            this.getComponent(`notify_ht_${this.input.id}`).show(window.__heretic.t("htable_nothingSelected"), "is-warning");
        }
    }

    onActionButtonClick(e) {
        e.preventDefault();
        const buttonId = e.target.closest("[data-id]").dataset.id;
        const itemId = e.target.closest("[data-item]").dataset.item;
        this.emit("action-button-click", {
            buttonId,
            itemId
        });
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
        const checkboxesUnique = [...new Set(checkboxes)];
        this.setState("checkboxes", checkboxesUnique);
        this.setState("checkboxesAll", checkboxesUnique.length === this.state.data.length);
    }

    onDeleteConfirmationClose() {

    }

    async onDeleteConfirmationButtonClick(id) {
        switch (id) {
        case "delete":
            await this.utils.waitForComponent(`deleteConfirmation_ht_${this.input.id}`);
            const deleteConfirmation = this.getComponent(`deleteConfirmation_ht_${this.input.id}`);
            deleteConfirmation.setCloseAllowed(false).setLoading(true);
            break;
        }
    }
};
