import debounce from "lodash/debounce";
import Utils from "#lib/componentUtils.js";

export default class {
    async onCreate(input, out) {
        this.state = {
            imageIndex: 0,
            modalActive: false,
            imageFull:
                "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
        };
        this.siteId = out.global.siteId;
        this.language = out.global.language;
        if (process.browser) {
            window.__heretic = window.__heretic || {};
            window.__heretic.outGlobal =
                window.__heretic.outGlobal || out.global;
            this.siteId =
                out.global.siteId || window.__heretic.outGlobal.siteId;
            this.language =
                out.global.language || window.__heretic.outGlobal.language;
        }
        if (input.admin) {
            await import(
                /* webpackChunkName: "himages-admin" */ "./style-admin.scss"
            );
        } else {
            await import(
                /* webpackChunkName: "himages-frontend" */ "./style-frontend.scss"
            );
        }
    }

    async onMount() {
        this.utils = new Utils(this, this.language);
        const swipe = await import("./swipe.js");
        swipe.default(window, document);
        await this.utils.waitForElement(`${this.input.id}_himages_wrap`);
        document.getElementById(`${this.input.id}_himages_wrap`).addEventListener("swiped-left", debounce(this.onLeftArrowClick.bind(this), 50));
        document.getElementById(`${this.input.id}_himages_wrap`).addEventListener("swiped-right", debounce(this.onRightArrowClick.bind(this), 50));
    }

    onDotClick(e) {
        e.preventDefault();
        if (!e.target.closest("[data-id]")) {
            return;
        }
        const { id } = e.target.closest("[data-id]").dataset;
        this.setState("imageIndex", parseInt(id, 10));
    }

    onLeftArrowClick(e) {
        e.preventDefault();
        this.setState(
            "imageIndex",
            this.state.imageIndex === 0
                ? this.input.images.length - 1
                : this.state.imageIndex - 1,
        );
        this.setState(
            "imageFull",
            this.input.imagesFull[this.state.imageIndex],
        );
    }

    onRightArrowClick(e) {
        e.preventDefault();
        this.setState(
            "imageIndex",
            this.state.imageIndex === this.input.images.length - 1
                ? 0
                : this.state.imageIndex + 1,
        );
        this.setState(
            "imageFull",
            this.input.imagesFull[this.state.imageIndex],
        );
    }

    onImageClick(e) {
        e.preventDefault();
        if (window.matchMedia && !window.matchMedia("(min-width: 1024px)").matches) {
            return;
        }
        if (
            this.input.imagesFull &&
            this.input.imagesFull.length - 1 >= this.state.imageIndex
        ) {
            this.setState(
                "imageFull",
                this.input.imagesFull[this.state.imageIndex],
            );
            this.setState("modalActive", true);
        }
    }

    onModalClose(e) {
        e.preventDefault();
        this.setState("modalActive", false);
    }
}
