import axios from "axios";
import Utils from "#lib/componentUtils";
import Query from "#lib/queryBrowser";
import Cookies from "#lib/cookiesBrowser";
import pageConfig from "../page.js";
import moduleConfig from "../../module.js";
import languages from "#etc/languages.json";

export default class {
    async onCreate(input, out) {
        this.state = {
            ready: !process.browser,
            loadingError: false,
            editorContent: {},
            loading: false,
        };
        const editorContent = {};
        for (const k of Object.keys(languages)) {
            editorContent[k] = null;
        }
        this.state.editorContent = editorContent;
        this.language = out.global.language;
        this.siteTitle = out.global.siteTitle;
        this.siteId = out.global.siteId;
        this.cookieOptions = out.global.cookieOptions;
        this.systemRoutes = out.global.systemRoutes;
        if (process.browser) {
            window.__heretic = window.__heretic || {};
            window.__heretic.outGlobal = window.__heretic.outGlobal || out.global;
            this.language = this.language || window.__heretic.outGlobal.language;
            this.siteTitle = out.global.siteTitle || window.__heretic.outGlobal.siteTitle;
            this.siteId = out.global.siteId || window.__heretic.outGlobal.siteId;
            this.cookieOptions = out.global.cookieOptions || window.__heretic.outGlobal.cookieOptions;
            this.systemRoutes = out.global.systemRoutes || window.__heretic.outGlobal.systemRoutes;
            document.title = `${pageConfig.title[this.language]} – ${this.siteTitle}`;
        }
        this.utils = new Utils(this, this.language);
    }

    async loadFormData(id) {
        let formData;
        if (id) {
            try {
                const response = await axios({
                    method: "post",
                    url: `/api/${moduleConfig.id}/lock/check`,
                    data: {
                        id,
                    },
                    headers: {
                        Authorization: `Bearer ${this.currentToken}`,
                    },
                });
                if (response.data.lock) {
                    this.setState("loadingError", `${window.__heretic.t("lockedBy")}: ${response.data.lock.username}`);
                    return;
                }
            } catch {
                this.setState("loadingError", true);
                return;
            }
            try {
                const response = await axios({
                    method: "post",
                    url: `/api/${moduleConfig.id}/load`,
                    data: {
                        id,
                    },
                    headers: {
                        Authorization: `Bearer ${this.currentToken}`,
                    },
                });
                formData = response.data;
                this.currentId = id;
            } catch {
                this.setState("loadingError", true);
                return;
            }
        }
        this.setState("ready", true);
        await this.utils.waitForComponent(`${moduleConfig.id}Form`);
        const editForm = this.getComponent(`${moduleConfig.id}Form`);
        if (formData) {
            editForm.setData(formData.item);
            editForm.deserializeData(formData.item);
            if (editForm.getMode() === "edit" && this.currentId) {
                this.sendLockAction("lock");
                this.startLockMessaging();
            }
        }
        if (id) {
            editForm.setTitle(`${window.__heretic.t("editPage")}: ${formData.title}`);
            this.setState("editorContent", formData.content);
        } else {
            editForm.setTitle(window.__heretic.t("newPage"));
        }
    }

    async onMount() {
        await this.utils.waitForLanguageData();
        await this.utils.loadLanguageData(moduleConfig.id);
        this.t = window.__heretic.t;
        this.query = new Query();
        this.cookies = new Cookies(this.cookieOptions, this.siteId);
        const id = this.query.get("id");
        this.currentToken = this.cookies.get(`${this.siteId}.authToken`);
        if (!this.currentToken) {
            setTimeout(() => window.location.href = `${this.getLocalizedURL(this.systemRoutes.signIn)}?r=${this.getLocalizedURL(moduleConfig.routes.userspace.edit.path)}%3Fid%3D${id}`, 500);
            return;
        }
        await this.loadFormData(id);
        const EditorJS = (await import("@editorjs/editorjs")).default;
        const Header = (await import("@editorjs/header")).default;
        const ImageTool = (await import("@editorjs/image")).default;
        const DragDrop = (await import("editorjs-drag-drop")).default;
        const Quote = (await import("@editorjs/quote")).default;
        const Warning = (await import("@editorjs/warning")).default;
        const List = (await import("@editorjs/list")).default;
        const ChangeCase = (await import("editorjs-change-case")).default;
        const RawTool = (await import("@editorjs/raw")).default;
        const Table = (await import("@editorjs/table")).default;
        await this.utils.waitForElement("editorjs");
        this.editor = new EditorJS({
            holder: "editorjs",
            tools: {
                header: Header,
                quote: Quote,
                warning: Warning,
                list: List,
                changeCase: ChangeCase,
                rawTool: RawTool,
                table: Table,
                image: {
                    class: ImageTool,
                    config: {
                        endpoints: {
                            byFile: "/api/admin/upload/image",
                            // byUrl: "http://localhost:8008/fetchUrl",
                        },
                        additionalRequestHeaders: {
                            Authorization: `Bearer ${this.currentToken}`,
                        },
                    }
                },
            },
            onReady: async () => {
                new DragDrop(this.editor);
                if (id) {
                    const editForm = this.getComponent(`${moduleConfig.id}Form`);
                    this.editor.render(this.state.editorContent[editForm.getActiveTab()]);
                }
            }
        });
        setTimeout(() => this.getComponent(`${moduleConfig.id}Form`).focus());
    }

    sendLockAction(action) {
        if (this.socketInterval && action === "unlock") {
            clearInterval(this.socketInterval);
            this.socketInterval = null;
        }
        if (window.__heretic.webSocket) {
            try {
                window.__heretic.webSocket.sendMessage({
                    module: moduleConfig.id,
                    action,
                    id: this.currentId,
                });
            } catch {
                if (this.socketInterval) {
                    clearInterval(this.socketInterval);
                    this.socketInterval = null;
                }
            }
        }
    }

    startLockMessaging() {
        if (window.__heretic.webSocket && this.currentId && !this.socketInterval) {
            this.socketInterval = setInterval(() => this.sendLockAction("lock"), 20000);
        }
    }

    getNonLocalizedURL(url) {
        return this.utils.getNonLocalizedURL(url);
    }

    getLocalizedURL(url) {
        return this.utils.getLocalizedURL(url);
    }

    async submitForm() {
        const editForm = this.getComponent(`${moduleConfig.id}Form`);
        const serializedData = editForm.process();
        if (!serializedData) {
            return;
        }
        const {
            editorContent,
        } = this.state;
        editorContent[editForm.getActiveTab()] = await this.editor.save();
        this.setState("editorContent", editorContent);
        const data = new FormData();
        data.append("tabs", JSON.stringify(serializedData.tabs));
        data.append("formTabs", JSON.stringify(serializedData.formTabs));
        data.append("formShared", JSON.stringify(serializedData.formShared));
        data.append("editorContent", JSON.stringify(editorContent));
        if (this.currentId) {
            data.append("id", this.currentId);
        }
        for (const k of Object.keys(serializedData.upload)) {
            data.append(k, serializedData.upload[k]);
        }
        editForm.setErrorMessage(null);
        editForm.setErrors(null);
        editForm.setLoading(true);
        this.setState("loading", true);
        try {
            const submitResult = await axios({
                method: "post",
                url: `/api/${moduleConfig.id}/save`,
                data,
                headers: {
                    Authorization: `Bearer ${this.currentToken}`,
                },
                onUploadProgress: () => {}
            });
            const result = {};
            if (submitResult.data.insertedId) {
                result.insertedId = submitResult.data.insertedId;
            }
            const {
                title,
            } = submitResult.data;
            editForm.setTitle(`${window.__heretic.t("editPage")}: ${title}`);
            this.startLockMessaging();
            return result;
        } catch (e) {
            let message;
            if (e && e.response && e.response.data) {
                if (e.response.data.form) {
                    editForm.setErrors(editForm.getErrorData(e.response.data.form));
                    return;
                }
                if (e.response.data.message) {
                    message = this.t(e.response.data.message);
                }
            }
            editForm.setErrorMessage(message || this.t("hform_error_general"));
        } finally {
            editForm.setLoading(false);
            this.setState("loading", false);
        }
        return false;
    }

    closeForm(success = false) {
        const queryStore = this.query.getStore();
        delete queryStore.id;
        window.__heretic.router.navigate(`${moduleConfig.id}_list`, this.language, queryStore, {
            success,
        });
    }

    onButtonClick(btn) {
        if (this.state.loading) {
            return;
        }
        switch (btn.id) {
        case "close":
            this.closeForm();
            break;
        }
    }

    async onFormSubmit() {
        if (this.state.loading) {
            return;
        }
        const submitResult = await this.submitForm();
        if (!submitResult) {
            return;
        }
        await this.utils.waitForComponent(`notify_${pageConfig.id}`);
        this.getComponent(`notify_${pageConfig.id}`).show(window.__heretic.t("saveSuccess"), "is-success");
    }

    onCancelClick() {
        if (this.state.loading) {
            return;
        }
        const queryStore = this.query.getStore();
        delete queryStore.id;
        window.__heretic.router.navigate(`${moduleConfig.id}_list`, this.language, queryStore, {});
    }

    onDestroy() {
        this.sendLockAction("unlock");
    }

    onFormValueChange() {
        // You may wish to handle this event
    }

    async onTabClick(tabData) {
        if (this.state.loading) {
            return;
        }
        const {
            editorContent,
        } = this.state;
        editorContent[tabData.old] = await this.editor.save();
        if (editorContent[tabData.current] && editorContent[tabData.current].blocks && editorContent[tabData.current].blocks.length) {
            await this.editor.render(editorContent[tabData.current]);
        } else {
            await this.editor.clear();
        }
    }

    async onSaveAndCloseClick(e) {
        e.preventDefault();
        if (await this.submitForm()) {
            this.closeForm(true);
        }
    }

    async onSaveClick(e) {
        e.preventDefault();
        if (await this.submitForm()) {
            await this.utils.waitForComponent(`notify_${pageConfig.id}`);
            this.getComponent(`notify_${pageConfig.id}`).show(window.__heretic.t("saveSuccess"), "is-success");
        }
    }
}
