import axios from "axios";
import Utils from "#lib/componentUtils";

export default class {
    async onCreate(input, out) {
        this.state = {
            ready: false,
            success: false,
        };
        if (input.admin) {
            await import( /* webpackChunkName: "hcontact-admin" */ "./style-admin.scss");
        } else {
            await import( /* webpackChunkName: "hcontact-frontend" */ "./style-frontend.scss");
        }
        this.siteId = out.global.siteId;
        this.cookiesUserCheck = out.global.cookiesUserCheck;
        this.language = out.global.language;
        if (process.browser) {
            window.__heretic = window.__heretic || {};
            window.__heretic.outGlobal = window.__heretic.outGlobal || out.global || {};
            this.siteId = out.global.siteId || window.__heretic.outGlobal.siteId;
            this.language = this.language || window.__heretic.outGlobal.language;
        }
    }

    async onMount() {
        this.utils = new Utils(this, this.language);
        await this.utils.waitForLanguageData();
        this.t = window.__heretic.t;
        this.setState("ready", true);
    }

    async onFormSubmit() {
        this.utils.waitForComponent("contactForm");
        const contactForm = this.getComponent("contactForm");
        contactForm.setErrors(false);
        const validationResult = contactForm.validate(contactForm.saveView());
        if (validationResult) {
            return contactForm.setErrors(contactForm.getErrorData(validationResult));
        }
        const data = contactForm.serializeData();
        contactForm.setErrorMessage(null).setErrors(null).setLoading(true);
        try {
            await axios({
                method: "post",
                url: "/api/contact",
                data: {
                    ...data,
                    language: this.language,
                },
                headers: {},
            });
            contactForm.setLoading(false);
            this.setState("success", true);
        } catch (e) {
            if (e && e.response && e.response.data) {
                if (e.response.data.form) {
                    const errorData = contactForm.getErrorData(e.response.data.form);
                    contactForm.setErrors(errorData);
                }
                if (e.response.data.message) {
                    contactForm.setErrorMessage(this.t(e.response.data.message));
                } else {
                    contactForm.setErrorMessage(this.t("hform_error_general"));
                }
                contactForm.loadCaptchaData("captcha");
            } else {
                contactForm.setErrorMessage(this.t("hform_error_general"));
            }
            contactForm.setLoading(false);
        }
    }
}
