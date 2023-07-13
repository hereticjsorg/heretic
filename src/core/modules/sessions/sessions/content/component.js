import axios from "axios";
import {
    format,
} from "date-fns";
import Utils from "#lib/componentUtils";
import Query from "#lib/queryBrowser";
import Cookies from "#lib/cookiesBrowser";
import moduleConfig from "../../module.js";
import pageConfig from "../page.js";

export default class {
    onCreate(input, out) {
        this.state = {
            ready: !process.browser,
            failed: false,
            headers: {},
            sessionId: null,
            sessionDateTime: null,
            sessionIp: null,
            sessionUsername: null,
            sessionExtras: null,
            formData: null,
        };
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
            document.title = `${pageConfig.title[this.language]} – ${this.siteTitle}`;
        }
        this.utils = new Utils(this, this.language);
    }

    setFormData(formData) {
        this.state.formData = formData;
    }

    async onMount() {
        await this.utils.waitForLanguageData();
        await this.utils.loadLanguageData(moduleConfig.id);
        if (!this.mongoEnabled) {
            return;
        }
        this.t = window.__heretic.t;
        this.query = new Query();
        this.cookies = new Cookies(this.cookieOptions);
        const currentToken = this.cookies.get(`${this.siteId}.authToken`);
        if (!currentToken) {
            setTimeout(() => window.location.href = this.utils.getLocalizedURL(this.systemRoutes.signInAdmin), 100);
            return;
        }
        this.setState("headers", {
            Authorization: `Bearer ${currentToken}`
        });
        this.setState("ready", true);
        await this.utils.waitForComponent(`${moduleConfig.id}List`);
    }

    onTopButtonClick() {}

    async onActionButtonClick(data) {
        switch (data.buttonId) {
        case "view":
            await this.utils.waitForComponent(`${moduleConfig.id}List`);
            const table = this.getComponent(`${moduleConfig.id}List`);
            table.setLoading(true);
            let responseData;
            try {
                const response = await axios({
                    method: "post",
                    url: `/api/${moduleConfig.id}/load`,
                    data: {
                        id: data.itemId,
                        language: this.language,
                    },
                    headers: this.state.headers,
                });
                responseData = response.data._default;
            } catch {
                this.getComponent(`notify_${moduleConfig.id}List`).show(window.__heretic.t("loadingError"), "is-danger");
                return;
            } finally {
                table.setLoading(false);
            }
            await this.utils.waitForComponent(`${moduleConfig.id}EditModal`);
            const modalDialog = await this.getComponent(`${moduleConfig.id}EditModal`);
            modalDialog.setTitle(this.t("viewSession"));
            this.setState("sessionId", responseData._id);
            this.setState("sessionDateTime", format(new Date(responseData.createdAt * 1000), `${this.t("global.dateFormatShort")} ${this.t("global.timeFormatShort")}`));
            this.setState("sessionLocation", responseData.location);
            this.setState("sessionUsername", responseData.username);
            this.setState("sessionExtras", responseData.extras);
            modalDialog.setActive(true).setCloseAllowed(true).setLoading(false);
            this.setState("sessionIp", responseData.ip);
            break;
        }
    }

    onFormMountComplete() {}

    onUnauthorized() {
        this.setState("ready", false);
        setTimeout(() => window.location.href = this.utils.getLocalizedURL(this.systemRoutes.signInAdmin), 100);
    }

    onFormSubmit() {
        this.formSave();
    }

    async onModalButtonClick(button) {
        switch (button) {
        case "save":
            await this.formSave();
            break;
        }
    }
}
