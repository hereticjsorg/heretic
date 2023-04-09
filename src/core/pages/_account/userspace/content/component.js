const axios = require("axios");
const debounce = require("lodash.debounce");
const config = require("../../page.js");
const Utils = require("../../../../lib/componentUtils").default;
const Cookies = require("../../../../lib/cookiesBrowser").default;
const Query = require("../../../../lib/queryBrowser").default;
const Password = require("../../../../lib/password").default;
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
            currentAccountTab: "profile",
        };
        this.language = out.global.language;
        this.siteTitle = out.global.siteTitle;
        this.siteId = out.global.siteId;
        this.cookieOptions = out.global.cookieOptions;
        this.authOptions = out.global.authOptions;
        this.mongoEnabled = out.global.mongoEnabled;
        this.systemRoutes = out.global.systemRoutes;
        this.passwordPolicy = out.global.passwordPolicy;
        if (process.browser && window.__heretic && window.__heretic.t) {
            this.authOptions = this.authOptions || window.__heretic.outGlobal.authOptions;
            this.mongoEnabled = this.mongoEnabled || window.__heretic.outGlobal.mongoEnabled;
            this.language = this.language || window.__heretic.outGlobal.language;
            this.siteTitle = out.global.siteTitle || window.__heretic.outGlobal.siteTitle;
            this.siteId = out.global.siteId || window.__heretic.outGlobal.siteId;
            this.cookieOptions = out.global.cookieOptions || window.__heretic.outGlobal.cookieOptions;
            this.systemRoutes = out.global.systemRoutes || window.__heretic.outGlobal.systemRoutes;
            this.passwordPolicy = out.global.passwordPolicy || window.__heretic.outGlobal.passwordPolicy;
            document.title = `${config.title[this.language]} – ${this.siteTitle}`;
        }
        this.utils = new Utils(this, this.language);
        this.password = new Password(this.passwordPolicy);
    }

    getLocalizedURL(url) {
        return this.utils.getLocalizedURL(url);
    }

    onPasswordChange() {
        setTimeout(() => {
            const passwordPolicyDiv = document.getElementById("hr_hf_el_passwordForm_passwordPolicy");
            const password = document.getElementById("hr_hf_el_passwordForm_password").value.trim();
            const check = this.password.checkPolicy(password);
            const htmlArr = [`<span class="tag is-light ${(!password.length || check.errors.indexOf("errorPasswordLength")) !== -1 ? "is-danger" : "is-success"}">${this.t(`passwordLength`)}: ${password.length}</span>`];
            for (const k of ["uppercase", "lowercase", "numbers", "special"]) {
                if (this.passwordPolicy.minGroups) {
                    htmlArr.push(`<span class="tag ${(check.groups.length >= this.passwordPolicy.minGroups ? (check.groups.indexOf(k) > -1 ? "is-success" : "") : (check.groups.indexOf(k) > -1 ? "is-success" : "is-danger"))} is-light">${this.t(`password_${k}`)}</span>`);
                } else {
                    htmlArr.push(`<span class="tag ${(check.groups.indexOf(k) > -1 ? "is-success" : "is-danger")} is-light">${this.t(`password_${k}`)}</span>`);
                }
            }
            passwordPolicyDiv.innerHTML = `<div class="tags">${htmlArr.join("")}</div>`;
        });
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
            this.setState("userData", {
                _default: data,
            });
        } catch {
            this.setState("error", true);
            return;
        }
        this.setState("ready", true);
        for (const f of ["profileForm", "passwordForm", "emailForm"]) {
            await this.utils.waitForComponent(f);
            const form = this.getComponent(f);
            form.deserializeData(this.state.userData);
        }
        await this.utils.waitForElement("hr_hf_el_passwordForm_passwordPolicy");
        await this.utils.waitForElement("hr_hf_el_passwordForm_password");
        document.getElementById("hr_hf_el_passwordForm_password").addEventListener("keydown", debounce(this.onPasswordChange.bind(this), 50));
        this.onPasswordChange();
        this.utils.waitForComponent("profileForm");
        const profileForm = this.getComponent("profileForm");
        setTimeout(() => profileForm.focus());
    }

    async onProfileFormSubmit() {
        this.utils.waitForComponent("profileForm");
        const profileForm = this.getComponent("profileForm");
        profileForm.setErrors(false);
        profileForm.setErrorMessage(false);
        const validationResult = profileForm.validate(profileForm.saveView());
        if (validationResult) {
            return profileForm.setErrors(profileForm.getErrorData(validationResult));
        }
        profileForm.setLoading(true);
        const formData = profileForm.serializeData();
        try {
            await axios({
                method: "post",
                url: "/api/user/saveProfile",
                data: formData.formTabs._default,
                headers: {
                    Authorization: `Bearer ${this.currentToken}`,
                },
            });
            this.getComponent("notify").show(this.t("saveSuccess"), "is-success");
        } catch (e) {
            profileForm.setErrorMessage(this.t("couldNotSaveData"));
            if (e && e.response && e.response.data && e.response.data.errors) {
                profileForm.setErrors(profileForm.getErrorData(e.response.data.errors));
            }
        } finally {
            profileForm.setLoading(false);
        }
    }

    async onPasswordFormSubmit() {
        this.utils.waitForComponent("passwordForm");
        const passwordForm = this.getComponent("passwordForm");
        passwordForm.setErrors(false);
        passwordForm.setErrorMessage(false);
        const validationResult = passwordForm.validate(passwordForm.saveView());
        if (validationResult) {
            return passwordForm.setErrors(passwordForm.getErrorData(validationResult));
        }
        passwordForm.setLoading(true);
        const formData = passwordForm.serializeData();
        try {
            await axios({
                method: "post",
                url: "/api/user/changePassword",
                data: formData.formTabs._default,
                headers: {
                    Authorization: `Bearer ${this.currentToken}`,
                },
            });
            this.getComponent("notify").show(this.t("saveSuccess"), "is-success");
            this.cookies.delete(`${this.siteId}.authToken`);
            setTimeout(() => window.location.href = `${this.getLocalizedURL(this.systemRoutes.signIn)}?r=${this.getLocalizedURL(pageConfig.path)}`, 100);
        } catch (e) {
            passwordForm.setLoading(false);
            passwordForm.setErrorMessage(this.t("couldNotSaveData"));
            if (e && e.response && e.response.data && e.response.data.errors) {
                passwordForm.setErrors(passwordForm.getErrorData(e.response.data.errors));
                if (e.response.data.policyErrors) {
                    passwordForm.setErrorMessage(`${this.t("passwordPolicyViolation")}: ${e.response.data.policyErrors.map(i => this.t(i)).join(", ")}`);
                }
            }
        }
    }

    async onEmailFormSubmit() {
        this.utils.waitForComponent("emailForm");
        const emailForm = this.getComponent("emailForm");
        emailForm.setErrors(false);
        emailForm.setErrorMessage(false);
        const validationResult = emailForm.validate(emailForm.saveView());
        if (validationResult) {
            return emailForm.setErrors(emailForm.getErrorData(validationResult));
        }
        emailForm.setLoading(true);
        const formData = emailForm.serializeData();
        try {
            await axios({
                method: "post",
                url: "/api/user/changeEmail",
                data: {
                    ...formData.formTabs._default,
                    language: this.language,
                },
                headers: {
                    Authorization: `Bearer ${this.currentToken}`,
                },
            });
            this.getComponent("changeEmailModal").setActive(true).setCloseAllowed(true).setLoading(false);
        } catch (e) {
            emailForm.setErrorMessage(this.t("couldNotSaveData"));
            if (e && e.response && e.response.data && e.response.data.errors) {
                emailForm.setErrors(emailForm.getErrorData(e.response.data.errors));
            }
        } finally {
            emailForm.setLoading(false);
        }
    }

    async onAccountTabsClick(e) {
        e.preventDefault();
        const {
            id,
        } = e.target.closest("[data-id]").dataset;
        this.setState("currentAccountTab", id);
        await this.utils.waitForComponent(`${id}Form`);
        const form = this.getComponent(`${id}Form`);
        setTimeout(() => form.focus());
    }
};
