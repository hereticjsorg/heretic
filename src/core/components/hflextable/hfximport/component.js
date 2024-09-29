import xlsx from "xlsx";
import { parse, isValid } from "date-fns";
import axios from "axios";
import cloneDeep from "lodash/cloneDeep";
import Utils from "#lib/componentUtils.js";

export default class {
    async onCreate(input, out) {
        this.state = {
            importColumns: [],
            importColumnsData: {},
            importWorksheet: null,
            bulkItemTypes: ["text", "select", "date"],
        };
        if (input.admin) {
            await import(
                /* webpackChunkName: "hfximport-admin" */ "./style-admin.scss"
            );
        } else {
            await import(
                /* webpackChunkName: "hfximport-frontend" */ "./style-frontend.scss"
            );
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
            window.__heretic.outGlobal =
                window.__heretic.outGlobal || out.global || {};
            this.authOptions =
                this.authOptions || window.__heretic.outGlobal.authOptions;
            this.mongoEnabled =
                this.mongoEnabled || window.__heretic.outGlobal.mongoEnabled;
            this.language =
                this.language || window.__heretic.outGlobal.language;
            this.siteTitle =
                out.global.siteTitle || window.__heretic.outGlobal.siteTitle;
            this.siteId =
                out.global.siteId || window.__heretic.outGlobal.siteId;
            this.cookieOptions =
                out.global.cookieOptions ||
                window.__heretic.outGlobal.cookieOptions;
            this.systemRoutes =
                out.global.systemRoutes ||
                window.__heretic.outGlobal.systemRoutes;
        }
    }

    async onMount() {
        this.utils = new Utils(this, this.language);
    }

    async show() {
        await this.utils.waitForComponent(`importModal_hf_${this.input.id}`);
        const importModal = this.getComponent(
            `importModal_hf_${this.input.id}`,
        );
        importModal
            .setActive(true)
            .setCloseAllowed(true)
            .setBackgroundCloseAllowed(false)
            .setLoading(false);
        this.setState("importColumns", []);
        this.setState("importColumnsData", {});
        this.setState("importWorksheet", null);
    }

    async notify(message, css = "is-success") {
        this.emit("notification", {
            message,
            css,
        });
    }

    async onImportButtonClick(button) {
        switch (button) {
            case "save":
                if (!this.state.importWorksheet) {
                    await this.notify("htable_nothingToImport", "is-warning");
                    break;
                }
                const importDataExcel = [];
                const update = [];
                for (const c of Object.keys(this.state.importColumnsData)) {
                    if (this.state.importColumnsData[c].targetColumn) {
                        importDataExcel.push({
                            column: c,
                            targetColumn:
                                this.state.importColumnsData[c].targetColumn,
                            type:
                                this.state.importColumnsData[c].type || "text",
                        });
                        if (this.state.importColumnsData[c].update) {
                            update.push(
                                this.state.importColumnsData[c].targetColumn,
                            );
                        }
                    }
                }
                if (!importDataExcel.length) {
                    await this.notify("htable_nothingToImport", "is-warning");
                    break;
                }
                const importData = [];
                const range = xlsx.utils.decode_range(
                    this.state.importWorksheet["!ref"],
                );
                for (let row = 1; row <= range.e.r; row += 1) {
                    const item = {};
                    for (let col = 0; col < range.e.c; col += 1) {
                        const columnTitle = this.state.importColumns.find(
                            (_, i) => i === col,
                        );
                        if (
                            columnTitle &&
                            this.state.importColumnsData[columnTitle] &&
                            this.state.importColumnsData[columnTitle]
                                .targetColumn
                        ) {
                            item[
                                this.state.importColumnsData[
                                    columnTitle
                                ].targetColumn
                            ] = this.getCellValue(
                                this.state.importWorksheet,
                                col,
                                row,
                                this.state.importColumnsData[columnTitle].type,
                            );
                        }
                    }
                    importData.push(item);
                }
                if (!importData.length) {
                    await this.notify("htable_nothingToImport", "is-warning");
                    break;
                }
                const importModal = this.getComponent(
                    `importModal_hf_${this.input.id}`,
                );
                try {
                    importModal
                        .setCloseAllowed(false)
                        .setBackgroundCloseAllowed(false)
                        .setLoading(true);
                    const { data } = await axios({
                        method: "post",
                        url: this.input.importConfig.url,
                        data: {
                            items: importData,
                            update,
                        },
                        headers: this.input.headers || {},
                    });
                    importModal.setActive(false);
                    await this.notify(
                        `${window.__heretic.t("htable_importSuccess")}: ${data.successCount}<br/>${window.__heretic.t("htable_importFailed")}: ${data.failCount}`,
                    );
                    importModal
                        .setCloseAllowed(true)
                        .setBackgroundCloseAllowed(true)
                        .setLoading(false);
                    this.emit("import-success");
                } catch {
                    importModal
                        .setCloseAllowed(true)
                        .setBackgroundCloseAllowed(true)
                        .setLoading(false);
                    await this.notify("htable_importError", "is-danger");
                }
                break;
        }
    }

    getCellValue(worksheet, c, r, type = null) {
        const data =
            worksheet[
                xlsx.utils.encode_cell({
                    c,
                    r,
                })
            ];
        let value = data && data.w ? data.w : null;
        if (value !== null && type) {
            switch (type) {
                case "text":
                    value = String(value)
                        .replace(/\r/gm, "")
                        .replace(/\n/gm, "<br/>");
                    break;
                case "integer":
                    value = parseInt(value, 10) || null;
                    break;
                case "boolean":
                    value = value === "" ? null : value === "yes";
                    break;
                case "date":
                    let dateValue =
                        value === ""
                            ? null
                            : parse(value, "M/d/yy", new Date()) || null;
                    if (!isValid(dateValue)) {
                        dateValue =
                            value === ""
                                ? null
                                : parse(value, "dd.MM.yyyy", new Date()) ||
                                  null;
                    }
                    if (!isValid(dateValue)) {
                        dateValue =
                            value === ""
                                ? null
                                : parse(value, "yyyy-MM-dd", new Date()) ||
                                  null;
                    }
                    if (!isValid(dateValue)) {
                        dateValue =
                            value === ""
                                ? null
                                : parse(value, "dd/MM/yyyy", new Date()) ||
                                  null;
                    }
                    value = isValid(dateValue) ? dateValue : null;
                    break;
            }
        }
        return value;
    }

    async onImportFileInputChange(e) {
        e.preventDefault();
        if (!Array.from(e.target.files).length) {
            return;
        }
        const data = e.target.files[0];
        const workbook = xlsx.read(await data.arrayBuffer());
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const range = xlsx.utils.decode_range(worksheet["!ref"]);
        const columnsData = {};
        const columns = [];
        for (let c = 0; c < range.e.c; c += 1) {
            const column = this.getCellValue(worksheet, c, 0);
            columns.push(column);
            columnsData[column] = {};
        }
        this.setState("importColumns", columns);
        this.setState("importColumnsData", columnsData);
        this.setState("importWorksheet", worksheet);
    }

    onImportUpdateCheckboxChange(e) {
        e.preventDefault();
        const { column } = e.target.closest("[data-column]").dataset;
        const { checked } = e.target;
        const importColumnsData = cloneDeep(this.state.importColumnsData);
        importColumnsData[column] = importColumnsData[column] || {};
        importColumnsData[column].update = checked;
        this.setState("importColumnsData", importColumnsData);
    }

    onImportColumnChange(e) {
        e.preventDefault();
        const { column } = e.target.closest("[data-column]").dataset;
        const { value } = e.target;
        const importColumnsData = cloneDeep(this.state.importColumnsData);
        importColumnsData[column] = importColumnsData[column] || {};
        importColumnsData[column].targetColumn = value;
        this.setState("importColumnsData", importColumnsData);
    }

    onImportTypeChange(e) {
        e.preventDefault();
        const { column } = e.target.closest("[data-column]").dataset;
        const { value } = e.target;
        const importColumnsData = cloneDeep(this.state.importColumnsData);
        importColumnsData[column] = importColumnsData[column] || {};
        importColumnsData[column].type = value || "text";
        this.setState("importColumnsData", importColumnsData);
    }
}
