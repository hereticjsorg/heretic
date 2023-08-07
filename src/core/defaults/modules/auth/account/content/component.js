import qrcode from "qrcode";
import axios from "axios";
import Utils from "#lib/componentUtils";
import Cookies from "#lib/cookiesBrowser";
import Query from "#lib/queryBrowser";
import pageConfig from "../page.js";
import moduleConfig from "../../module.js";

export default class {
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
            qrCode: "",
            secret: "",
            recoveryCode: "",
            tfaConfigured: false,
        };
        this.language = out.global.language;
        this.siteTitle = out.global.siteTitle;
        this.siteId = out.global.siteId;
        this.cookieOptions = out.global.cookieOptions;
        this.authOptions = out.global.authOptions;
        this.mongoEnabled = out.global.mongoEnabled;
        this.systemRoutes = out.global.systemRoutes;
        this.passwordPolicy = out.global.passwordPolicy;
        this.demo = out.global.demo;
        if (process.browser) {
            window.__heretic = window.__heretic || {};
            window.__heretic.outGlobal = window.__heretic.outGlobal || out.global;
            this.authOptions = this.authOptions || window.__heretic.outGlobal.authOptions;
            this.mongoEnabled = this.mongoEnabled || window.__heretic.outGlobal.mongoEnabled;
            this.language = this.language || window.__heretic.outGlobal.language;
            this.siteTitle = out.global.siteTitle || window.__heretic.outGlobal.siteTitle;
            this.siteId = out.global.siteId || window.__heretic.outGlobal.siteId;
            this.cookieOptions = out.global.cookieOptions || window.__heretic.outGlobal.cookieOptions;
            this.systemRoutes = out.global.systemRoutes || window.__heretic.outGlobal.systemRoutes;
            this.passwordPolicy = out.global.passwordPolicy || window.__heretic.outGlobal.passwordPolicy;
            this.demo = out.global.demo || window.__heretic.outGlobal.demo;
            document.title = `${pageConfig.title[this.language]} – ${this.siteTitle}`;
        }
        this.utils = new Utils(this, this.language);
    }

    getLocalizedURL(url) {
        return this.utils.getLocalizedURL(url);
    }

    async onMount() {
        await this.utils.waitForLanguageData();
        await this.utils.loadLanguageData(moduleConfig.id);
        if (!this.mongoEnabled || !this.authOptions.signIn) {
            return;
        }
        this.t = window.__heretic.t;
        this.cookies = new Cookies(this.cookieOptions);
        this.query = new Query();
        this.currentToken = this.cookies.get(`${this.siteId}.authToken`);
        if (!this.currentToken) {
            setTimeout(() => window.location.href = `${this.getLocalizedURL(this.systemRoutes.signIn)}?r=${this.getLocalizedURL(moduleConfig.routes.userspace.account.path)}`, 100);
            return;
        }
        try {
            const {
                data,
            } = await axios({
                method: "get",
                url: moduleConfig.api.getData,
                data: {},
                headers: {
                    Authorization: `Bearer ${this.currentToken}`,
                },
            });
            this.setState("userData", {
                _default: data,
            });
            this.setState("tfaConfigured", data.tfaConfigured);
        } catch (e) {
            this.setState("error", true);
            return;
        }
        this.setState("ready", true);
        for (const f of ["profileForm", "passwordForm", "emailForm"]) {
            await this.utils.waitForComponent(f);
            const form = this.getComponent(f);
            form.deserializeData(this.state.userData);
        }
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
            if (e && e.response && e.response.data && e.response.data.form) {
                profileForm.setErrors(profileForm.getErrorData(e.response.data.form));
            } else {
                profileForm.setErrorMessage(this.t("couldNotSaveData"));
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
            setTimeout(() => window.location.href = `${this.getLocalizedURL(this.systemRoutes.signIn)}?r=${this.getLocalizedURL(moduleConfig.routes.userspace.account.path)}`, 100);
        } catch (e) {
            passwordForm.setLoading(false);
            if (e && e.response && e.response.data && e.response.data.form) {
                passwordForm.setErrors(passwordForm.getErrorData(e.response.data.form));
                if (e.response.data.policyErrors) {
                    passwordForm.setErrorMessage(`${this.t("passwordPolicyViolation")}: ${e.response.data.policyErrors.map(i => this.t(i)).join(", ")}`);
                }
            } else {
                passwordForm.setErrorMessage(this.t("couldNotSaveData"));
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
            if (e && e.response && e.response.data && e.response.data.form) {
                emailForm.setErrors(emailForm.getErrorData(e.response.data.form));
            } else {
                emailForm.setErrorMessage(this.t("couldNotSaveData"));
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
        if (id !== "2fa") {
            await this.utils.waitForComponent(`${id}Form`);
            const form = this.getComponent(`${id}Form`);
            setTimeout(() => form.focus());
        }
    }

    async setup2FA(e) {
        e.preventDefault();
        await this.utils.waitForComponent("setup2faModal");
        this.getComponent("setup2faModal").setActive(true).setCloseAllowed(false).setLoading(true);
        await this.utils.waitForElement("heretic_2fa_image_wrap");
        this.setState("qrCode", "");
        this.setState("secret", "");
        try {
            const {
                data,
            } = await axios({
                method: "get",
                url: moduleConfig.api.getData2FA,
                data: {},
                headers: {
                    Authorization: `Bearer ${this.currentToken}`,
                },
            });
            this.getComponent("setup2faModal").setCloseAllowed(true).setLoading(false);
            const svgData = await qrcode.toString(data.url, {
                type: "svg",
                margin: 0,
            });

            this.setState("qrCode", svgData);
            this.setState("secret", data.secret);
        } catch (err) {
            this.getComponent("setup2faModal").setActive(false);
            this.getComponent("notify").show(this.t("setup2faError"), "is-danger");
        }
    }

    async onOtpFormSubmit() {
        this.utils.waitForComponent("otpForm");
        const otpForm = this.getComponent("otpForm");
        otpForm.setErrors(false);
        otpForm.setErrorMessage(false);
        const validationResult = otpForm.validate(otpForm.saveView());
        if (validationResult) {
            return otpForm.setErrors(otpForm.getErrorData(validationResult));
        }
        const formData = otpForm.serializeData();
        const {
            code,
        } = formData.formTabs._default;
        await this.utils.waitForComponent("setup2faModal");
        this.getComponent("setup2faModal").setCloseAllowed(false).setLoading(true);
        try {
            const {
                data,
            } = await axios({
                method: "post",
                url: moduleConfig.api.setData2FA,
                data: {
                    secret: this.state.secret,
                    code,
                },
                headers: {
                    Authorization: `Bearer ${this.currentToken}`,
                },
            });
            this.getComponent("notify").show(this.t("setup2faSuccess"), "is-success");
            this.getComponent("setup2faModal").setActive(false);
            this.setState("tfaConfigured", true);
            this.setState("recoveryCode", data.recoveryCode);
            await this.utils.waitForComponent("recoveryCodeModal");
            this.getComponent("recoveryCodeModal").setActive(true).setCloseAllowed(true).setLoading(false);
        } catch (err) {
            let errorMessage = "setup2faError";
            if (err && err.response && err.response.data && err.response.data.reason) {
                switch (err.response.data.reason) {
                case 1:
                    errorMessage = "setup2faErrorAlreadySet";
                    break;
                case 2:
                    otpForm.setErrors([{
                        id: "code",
                        tab: "_default",
                    }]);
                    otpForm.clearValues();
                    errorMessage = "setup2faErrorInvalidCode";
                    break;
                }
            }
            this.getComponent("notify").show(this.t(errorMessage), "is-danger");
            this.getComponent("setup2faModal").setCloseAllowed(true).setLoading(false);
        }
    }

    onSetup2FAButtonClick(id) {
        switch (id) {
        case "save":
            this.onOtpFormSubmit();
            break;
        }
    }

    async disable2FA(e) {
        e.preventDefault();
        await this.utils.waitForComponent("tfaModal");
        const tfaModal = await this.getComponent("tfaModal").getModalInstance();
        tfaModal.setCloseAllowed(true).setLoading(false).setActive(true);
        this.getComponent("tfaModal").onTfaGotAppClick();
    }

    async on2faDisable(code) {
        await this.utils.waitForComponent("tfaModal");
        const tfaModal = await this.getComponent("tfaModal").getModalInstance();
        tfaModal.setCloseAllowed(false).setLoading(true);
        try {
            await axios({
                method: "post",
                url: moduleConfig.api.disable2FA,
                data: {
                    code,
                },
                headers: {
                    Authorization: `Bearer ${this.currentToken}`,
                },
            });
            tfaModal.setCloseAllowed(true).setLoading(false).setActive(false);
            this.getComponent("notify").show(this.t("remove2faSuccess"), "is-success");
            this.setState("tfaConfigured", false);
        } catch (err) {
            let errorMessage = "setup2faError";
            if (err && err.response && err.response.data && err.response.data.reason) {
                switch (err.response.data.reason) {
                case 1:
                    errorMessage = "setup2faErrorUnset";
                    break;
                case 2:
                    errorMessage = "setup2faErrorInvalidCode";
                    break;
                }
            }
            this.getComponent("notify").show(this.t(errorMessage), "is-danger");
            tfaModal.setCloseAllowed(true).setLoading(false).setActive(false);
        }
    }

    async on2faDisableRecovery() {
        await this.utils.waitForComponent("tfaModal");
        const tfaModal = await this.getComponent("tfaModal").getModalInstance();
        tfaModal.setCloseAllowed(true).setLoading(false).setActive(false);
        this.getComponent("notify").show(this.t("remove2faSuccess"), "is-success");
        this.setState("tfaConfigured", false);
    }
}
