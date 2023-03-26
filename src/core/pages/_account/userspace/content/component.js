const axios = require("axios");
const config = require("../../page.js");
const Utils = require("../../../../lib/componentUtils").default;
const Cookies = require("../../../../lib/cookiesBrowser").default;
const Query = require("../../../../lib/queryBrowser").default;
const pageConfig = require("../../page");

module.exports = class {
    onCreate(input, out) {
        this.state = {
            ready: false,
            error: null,
            userData: {
                _default: {
                    username: null,
                },
            },
        };
        this.language = out.global.language;
        this.siteTitle = out.global.siteTitle;
        this.siteId = out.global.siteId;
        this.cookieOptions = out.global.cookieOptions;
        this.authOptions = out.global.authOptions;
        this.mongoEnabled = out.global.mongoEnabled;
        this.systemRoutes = out.global.systemRoutes;
        if (process.browser && window.__heretic && window.__heretic.t) {
            this.authOptions = this.authOptions || window.__heretic.outGlobal.authOptions;
            this.mongoEnabled = this.mongoEnabled || window.__heretic.outGlobal.mongoEnabled;
            this.language = this.language || window.__heretic.outGlobal.language;
            this.siteTitle = out.global.siteTitle || window.__heretic.outGlobal.siteTitle;
            this.siteId = out.global.siteId || window.__heretic.outGlobal.siteId;
            this.cookieOptions = out.global.cookieOptions || window.__heretic.outGlobal.cookieOptions;
            this.systemRoutes = out.global.systemRoutes || window.__heretic.outGlobal.systemRoutes;
            document.title = `${config.title[this.language]} – ${this.siteTitle}`;
        }
        this.utils = new Utils(this, this.language);
    }

    getLocalizedURL(url) {
        return this.utils.getLocalizedURL(url);
    }

    async onMount() {
        await this.utils.waitForLanguageData();
        await this.utils.loadLanguageData(pageConfig.id);
        if (!this.mongoEnabled || !this.authOptions.signIn) {
            return;
        }
        this.t = window.__heretic.t;
        this.cookies = new Cookies(this.cookieOptions);
        this.query = new Query();
        this.currentToken = this.cookies.get(`${this.siteId}.authToken`);
        if (!this.currentToken) {
            setTimeout(() => window.location.href = `${this.getLocalizedURL(this.systemRoutes.signIn)}?r=${this.getLocalizedURL(pageConfig.path)}`, 100);
            return;
        }
        try {
            const {
                data,
            } = await axios({
                method: "get",
                url: pageConfig.api.getData,
                data: {},
                headers: {
                    Authorization: `Bearer ${this.currentToken}`,
                },
            });
            // eslint-disable-next-line no-console
            this.setState("userData", {
                _default: data,
            });
        } catch {
            this.setState("error", true);
            return;
        }
        this.setState("ready", true);
        await this.utils.waitForComponent("accountForm");
        const accountForm = this.getComponent("accountForm");
        accountForm.deserializeData(this.state.userData);
        setTimeout(() => accountForm.focus());
    }

    async onFormSubmit() {
        this.utils.waitForComponent("accountForm");
        const accountForm = this.getComponent("accountForm");
        accountForm.setErrors(false);
        const validationResult = accountForm.validate(accountForm.saveView());
        if (validationResult) {
            return accountForm.setErrors(accountForm.getErrorData(validationResult));
        }
        const data = accountForm.getFormDataObject(accountForm.serializeData());
        // eslint-disable-next-line no-console
        console.log(data);
    }
};
