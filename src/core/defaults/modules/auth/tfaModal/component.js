import axios from "axios";
import Utils from "#lib/componentUtils";
import Cookies from "#lib/cookiesBrowser";
import moduleConfig from "../module.js";

export default class {
    onCreate(input, out) {
        this.state = {
            view: "2fa",
            username: null,
            password: null,
            token: null,
        };
        this.language = out.global.language;
        this.siteTitle = out.global.siteTitle;
        this.siteId = out.global.siteId;
        this.cookieOptions = out.global.cookieOptions;
        this.authOptions = out.global.authOptions;
        this.mongoEnabled = out.global.mongoEnabled;
        this.systemRoutes = out.global.systemRoutes;
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
        this.setState("view", "2fa");
        this.setState("ready", true);
    }

    async getModalInstance() {
        await this.utils.waitForComponent("tfaModal");
        return this.getComponent("tfaModal");
    }

    async onTfaNoAppClick(e) {
        e.preventDefault();
        this.setState("view", "recovery");
        await this.utils.waitForComponent("tfaRecoveryForm");
        setTimeout(() => this.getComponent("tfaRecoveryForm").focus());
    }

    async onTfaGotAppClick(e) {
        if (e && e.preventDefault) {
            e.preventDefault();
        }
        this.setState("view", "2fa");
        await this.utils.waitForComponent("tfaOtpForm");
        setTimeout(() => this.getComponent("tfaOtpForm").focus());
    }

    async onRecoveryFormSubmit() {
        await this.utils.waitForComponent("tfaRecoveryForm");
        const recoveryForm = this.getComponent("tfaRecoveryForm");
        const validationResult = recoveryForm.validate(recoveryForm.saveView());
        if (validationResult) {
            return recoveryForm.setErrors(recoveryForm.getErrorData(validationResult));
        }
        const formData = recoveryForm.serializeData();
        const {
            recoveryCode,
        } = formData.formTabs._default;
        this.getComponent("tfaModal").setCloseAllowed(false).setLoading(true);
        try {
            await axios({
                method: "post",
                url: moduleConfig.api.disable2FARecovery,
                data: {
                    recoveryCode: recoveryCode.toUpperCase(),
                    username: this.state.username,
                    password: this.state.password,
                    token: this.state.token,
                },
                headers: {
                    Authorization: `Bearer ${this.currentToken}`,
                },
            });
            if (this.state.token) {
                this.emit("recovery-code-token", {
                    recoveryCode,
                    token: this.state.token,
                });
            } else {
                this.emit("recovery-code", recoveryCode);
            }
        } catch (err) {
            let errorMessage = "setup2faError";
            if (err && err.response && err.response.data && err.response.data.reason) {
                switch (err.response.data.reason) {
                case 1:
                    errorMessage = "setup2faErrorUnset";
                    break;
                case 2:
                    recoveryForm.setErrors([{
                        id: "recoveryCode",
                        tab: "_default",
                    }]);
                    setTimeout(() => recoveryForm.clearValues());
                    errorMessage = "remove2faInvalidRecoveryCode";
                    break;
                }
            }
            this.getComponent("notify").show(this.t(errorMessage), "is-danger");
            this.getComponent("tfaModal").setCloseAllowed(true).setLoading(false);
        }
    }

    setCredentials(username, password) {
        this.setState("username", username);
        this.setState("password", password);
    }

    setToken(token) {
        this.setState("token", token);
    }

    async onOtpFormSubmit() {
        await this.utils.waitForComponent("tfaOtpForm");
        const otpForm = this.getComponent("tfaOtpForm");
        const validationResult = otpForm.validate(otpForm.saveView());
        if (validationResult) {
            return otpForm.setErrors(otpForm.getErrorData(validationResult));
        }
        const formData = otpForm.serializeData();
        const {
            code,
        } = formData.formTabs._default;
        this.getComponent("tfaModal").setCloseAllowed(false).setLoading(true);
        try {
            await axios({
                method: "post",
                url: moduleConfig.api.checkOTP,
                data: {
                    code,
                    username: this.state.username,
                    password: this.state.password,
                    token: this.state.token,
                },
                headers: {
                    Authorization: `Bearer ${this.currentToken}`,
                },
            });
            if (this.state.token) {
                this.emit("code-token", {
                    code,
                    token: this.state.token,
                });
            } else {
                this.emit("code", code);
            }
        } catch (err) {
            let errorMessage = "setup2faError";
            if (err && err.response && err.response.data && err.response.data.reason) {
                switch (err.response.data.reason) {
                case 1:
                    errorMessage = "setup2faErrorUnset";
                    break;
                case 2:
                    otpForm.setErrors([{
                        id: "code",
                        tab: "_default",
                    }]);
                    setTimeout(() => otpForm.clearValues());
                    errorMessage = "setup2faErrorInvalidCode";
                    break;
                }
            }
            this.getComponent("notify").show(this.t(errorMessage), "is-danger");
            this.getComponent("tfaModal").setCloseAllowed(true).setLoading(false);
        }
    }

    onTfaButtonClick(id) {
        switch (id) {
        case "save":
            if (this.state.view === "2fa") {
                this.onOtpFormSubmit();
            } else {
                this.onRecoveryFormSubmit();
            }
            break;
        }
    }
}
