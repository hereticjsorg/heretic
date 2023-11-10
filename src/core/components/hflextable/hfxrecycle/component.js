// import cloneDeep from "lodash.clonedeep";
import axios from "axios";
import Utils from "#lib/componentUtils";

export default class {
    async onCreate(input, out) {
        this.state = {
            recycleBin: {},
            recycleBinList: [],
            recycleBinPagination: [],
            recycleDeleteItems: null,
            recycleBinTotalPages: 0,
            currentRecycleBinListPage: 1,
            itemsPerPage: 30,
            page: 1,
        };
        if (input.admin) {
            await import( /* webpackChunkName: "hrecycle-admin" */ "./style-admin.scss");
        } else {
            await import( /* webpackChunkName: "hrecycle-frontend" */ "./style-frontend.scss");
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

    async loadRecycleBinData(input = {
        page: this.state.currentRecycleBinListPage,
    }) {
        await this.utils.waitForComponent(`recycleBinModal_hf_${this.input.id}`);
        const recycleBinModal = this.getComponent(`recycleBinModal_hf_${this.input.id}`);
        recycleBinModal.setActive(true).setCloseAllowed(false).setBackgroundCloseAllowed(true).setLoading(true);
        try {
            const response = await axios({
                method: "post",
                url: this.input.recycleBin.url.list,
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
            await this.notify("htable_loadingError", "is-danger");
            this.setState("recycleBinList", []);
        } finally {
            recycleBinModal.setLoading(false).setCloseAllowed(true);
        }
        if (window.__heretic && window.__heretic.setTippy) {
            window.__heretic.setTippy();
        }
    }

    async show() {
        await this.utils.waitForComponent(`recycleBinModal_hf_${this.input.id}`);
        const modal = this.getComponent(`recycleBinModal_hf_${this.input.id}`);
        modal.setActive(true).setCloseAllowed(true).setBackgroundCloseAllowed(true).setLoading(false);
        this.loadRecycleBinData();
    }

    async notify(message, css = "is-success") {
        this.emit("notification", {
            message,
            css,
        });
    }

    onRecycleBinButtonClick() {}

    async onRecycleBinRestoreClick(event) {
        event.preventDefault();
        const {
            id,
        } = event.target.closest("[data-id]").dataset;
        await this.utils.waitForComponent(`recycleBinModal_hf_${this.input.id}`);
        const recycleBinModal = this.getComponent(`recycleBinModal_hf_${this.input.id}`);
        recycleBinModal.setActive(true).setCloseAllowed(false).setLoading(true);
        try {
            const restoreResult = await axios({
                method: "post",
                url: this.input.recycleBin.url.restore,
                data: {
                    ids: [id],
                },
                headers: this.input.headers || {},
            });
            await this.loadRecycleBinData({
                page: 1
            });
            await this.notify(`${window.__heretic.t("htable_restoreSuccess")}: ${restoreResult.data.count}`, "is-success");
            this.emit("success");
        } catch (e) {
            if (e && e.response && e.response.status === 403) {
                this.emit("unauthorized");
                return;
            }
            await this.notify("htable_loadingError", "is-danger");
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
        const title = this.state.recycleBinList.find(i => i._id === id)[this.input.recycleBin.title];
        recycleDeleteItems.push({
            id,
            title,
        });
        this.setState("recycleDeleteItems", recycleDeleteItems);
        await this.utils.waitForComponent(`deleteRecycleConfirmation_hf_${this.input.id}`);
        const deleteConfirmation = this.getComponent(`deleteRecycleConfirmation_hf_${this.input.id}`);
        deleteConfirmation.setActive(true).setCloseAllowed(true).setLoading(false);
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

    async onDeleteRecycleConfirmationButtonClick(button) {
        switch (button) {
        case "delete":
            await this.utils.waitForComponent(`deleteRecycleConfirmation_hf_${this.input.id}`);
            const deleteConfirmation = this.getComponent(`deleteRecycleConfirmation_hf_${this.input.id}`);
            deleteConfirmation.setCloseAllowed(false).setLoading(true);
            try {
                const deleteResult = await axios({
                    method: "post",
                    url: this.input.recycleBin.url.delete,
                    data: {
                        ids: this.state.recycleDeleteItems.map(i => i.id),
                    },
                    headers: this.input.headers || {},
                });
                await this.loadRecycleBinData({
                    page: 1
                });
                deleteConfirmation.setActive(false);
                await this.notify(`${window.__heretic.t("htable_deleteSuccess")}: ${deleteResult.data.count}`);
            } catch (e) {
                if (e && e.response && e.response.status === 403) {
                    this.emit("unauthorized");
                    return;
                }
                await this.notify("htable_loadingError", "is-danger");
            } finally {
                deleteConfirmation.setLoading(false).setCloseAllowed(true);
            }
            break;
        }
    }

    onReloadClick(e) {
        e.preventDefault();
        this.loadRecycleBinData({
            page: 1
        });
    }

    async onDeleteAllRecycleConfirmationButtonClick(button) {
        switch (button) {
        case "delete":
            await this.utils.waitForComponent(`deleteAllRecycleConfirmation_hf_${this.input.id}`);
            const deleteConfirmation = this.getComponent(`deleteAllRecycleConfirmation_hf_${this.input.id}`);
            deleteConfirmation.setCloseAllowed(false).setLoading(true);
            try {
                await axios({
                    method: "post",
                    url: this.input.recycleBin.url.deleteAll,
                    data: {},
                    headers: this.input.headers || {},
                });
                await this.loadRecycleBinData({
                    page: 1
                });
                deleteConfirmation.setActive(false);
                await this.notify("htable_deleteSuccess");
            } catch (e) {
                if (e && e.response && e.response.status === 403) {
                    this.emit("unauthorized");
                    return;
                }
                await this.notify("htable_loadingError", "is-danger");
            } finally {
                deleteConfirmation.setLoading(false).setCloseAllowed(true);
            }
            break;
        }
    }

    async onDeleteAllClick() {
        await this.utils.waitForComponent(`deleteAllRecycleConfirmation_hf_${this.input.id}`);
        const deleteConfirmation = this.getComponent(`deleteAllRecycleConfirmation_hf_${this.input.id}`);
        deleteConfirmation.setActive(true).setCloseAllowed(true).setLoading(false);
    }
}
