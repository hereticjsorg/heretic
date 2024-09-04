import Utils from "#lib/componentUtils.js";

export default class {
    async onCreate(input) {
        this.state = {
            active: input.active,
            closeAllowed: true,
            closeBackgroundAllowed: true,
            loading: false,
            title: input.title,
        };
        if (input.admin) {
            await import(
                /* webpackChunkName: "hmodal-admin" */ "./style-admin.scss"
            );
        } else {
            await import(
                /* webpackChunkName: "hmodal-frontend" */ "./style-frontend.scss"
            );
        }
    }

    onKeyDown(e) {
        if (
            e.key === "Escape" &&
            this.state.active &&
            this.state.closeAllowed
        ) {
            e.preventDefault();
            e.stopPropagation();
            this.onClose(e);
        }
    }

    onMount() {
        this.utils = new Utils(this);
        window.addEventListener("keydown", this.onKeyDown.bind(this));
    }

    setActive(flag) {
        if (window.__heretic) {
            if (window.__heretic.tippyHideAll) {
                window.__heretic.tippyHideAll();
            }
            window.__heretic.modalStack = window.__heretic.modalStack || [];
            if (flag) {
                window.__heretic.modalStack.push(this.input.id);
            } else {
                window.__heretic.modalStack.pop();
            }
        }
        this.setState("active", flag);
        return this;
    }

    setCloseAllowed(flag) {
        this.setState("closeAllowed", flag);
        return this;
    }

    setBackgroundCloseAllowed(flag) {
        this.setState("closeBackgroundAllowed", flag);
        return this;
    }

    setLoading(flag) {
        this.setState("loading", flag);
        return this;
    }

    onClose(e) {
        e.preventDefault();
        if (this.state.closeAllowed) {
            this.setActive(false);
            this.emit("close");
        }
    }

    onBackgroundClick(e) {
        e.preventDefault();
        if (this.state.closeBackgroundAllowed) {
            this.onClose(e);
        }
    }

    onActionButtonClick(e) {
        e.preventDefault();
        if (this.state.loading) {
            return;
        }
        const { id, close } = e.target.closest("[data-id]").dataset;
        this.emit("button-click", id);
        if (close !== undefined) {
            this.onClose(e);
        }
    }

    setTitle(title) {
        this.setState("title", title);
    }
}
