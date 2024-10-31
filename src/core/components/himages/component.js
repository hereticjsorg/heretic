export default class {
    async onCreate(input, out) {
        this.state = {
            imageIndex: 0,
            modalActive: false,
            imageFull:
                "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
        };
        this.siteId = out.global.siteId;
        if (process.browser) {
            window.__heretic = window.__heretic || {};
            window.__heretic.outGlobal =
                window.__heretic.outGlobal || out.global;
            this.siteId =
                out.global.siteId || window.__heretic.outGlobal.siteId;
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

    onMount() {
        //
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
