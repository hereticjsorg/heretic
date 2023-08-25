import Cropper from "#core/lib/3rdparty/js-cropper/main";
import Utils from "#lib/componentUtils";

export default class {
    async onCreate(input) {
        this.state = {
            active: false,
        };
        if (input.admin) {
            await import( /* webpackChunkName: "hprofilePicture-admin" */ "./style-admin.scss");
        } else {
            await import( /* webpackChunkName: "hprofilePicture-frontend" */ "./style-frontend.scss");
        }
    }

    async onMount() {
        this.utils = new Utils(this);
        await this.utils.waitForLanguageData();
        this.t = window.__heretic.t;
        this.cropper = new Cropper({
            width: 370,
            height: 370,
        });
    }

    onDestroy() {
    }

    async show() {
        this.setState("active", true);
        this.imageSet = false;
        await this.utils.waitForComponent("profilePictureEditor");
        this.getComponent("profilePictureEditor").setActive(true);
        await this.utils.waitForElement("profilePictureCropperWrap");
        this.cropper.render("#profilePictureCropper");
        // this.cropper.destroy();
    }

    async hide() {
        await this.utils.waitForComponent("profilePictureEditor");
        this.getComponent("profilePictureEditor").setActive(true);
        await this.utils.waitForElement("profilePictureCropperWrap");
        this.cropper.destroy();
        this.setState("active", false);
    }

    async onImportFileInputChange(e) {
        e.preventDefault();
        if (!Array.from(e.target.files).length) {
            return;
        }
        const data = e.target.files[0];
        try {
            await this.cropper.loadImageData(data);
        } catch (er) {
            this.getComponent("profilePictureNotify").show(this.t("profilePictureEditorLoadError"), "is-danger");
        }
        this.imageSet = true;
    }

    onProfilePictureEditorButtonClick(id) {
        switch (id) {
        case "save":
            if (!this.imageSet) {
                this.getComponent("profilePictureNotify").show(this.t("profilePictureEditorNoImage"), "is-warning");
                break;
            }
            const imageData = this.cropper.getCroppedImage();
            // eslint-disable-next-line no-console
            this.emit("image-data", imageData);
            break;
        case "close":
            break;
        }
    }
}
