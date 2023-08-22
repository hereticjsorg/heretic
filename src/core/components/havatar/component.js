import Cropper from "#core/lib/3rdparty/js-cropper/main";
import Utils from "#lib/componentUtils";

export default class {
    async onCreate(input) {
        this.state = {
            active: false,
        };
        if (input.admin) {
            await import( /* webpackChunkName: "havatar-admin" */ "./style-admin.scss");
        } else {
            await import( /* webpackChunkName: "havatar-frontend" */ "./style-frontend.scss");
        }
    }

    async onMount() {
        this.utils = new Utils(this);
        await this.utils.waitForLanguageData();
        this.t = window.__heretic.t;
    }

    async show() {
        this.setState("active", true);
        await this.utils.waitForComponent("avatarEditor");
        this.getComponent("avatarEditor").setActive(true);
        await this.utils.waitForElement("avatarCropper");
        this.cropper = new Cropper({
            width: 370,
            height: 370,
        });
        this.cropper.render("#avatarCropper");
    }

    async onImportFileInputChange(e) {
        e.preventDefault();
        if (!Array.from(e.target.files).length) {
            return;
        }
        const data = e.target.files[0];
        try {
            await this.cropper.loadImageData(data);
        } catch {
            this.getComponent("avatarNotify").show(this.t("avatarEditorLoadError"), "is-danger");
        }
    }
}
