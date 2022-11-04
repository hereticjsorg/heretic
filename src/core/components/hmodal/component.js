module.exports = class {
    onCreate(input) {
        this.state = {
            active: input.active,
            closeAllowed: true,
            closeBackgroundAllowed: true,
            loading: false,
            title: input.title,
        };
    }

    onKeyDown(e) {
        if (e.key === "Escape" && this.state.active && this.state.closeAllowed) {
            e.preventDefault();
            e.stopPropagation();
            this.setState("active", false);
        }
    }

    onMount() {
        window.addEventListener("keydown", this.onKeyDown.bind(this));
    }

    setActive(flag) {
        if (window.__heretic && window.__heretic.tippyHideAll) {
            window.__heretic.tippyHideAll();
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
        const {
            id,
            close,
        } = e.target.closest("[data-id]").dataset;
        this.emit("button-click", id);
        if (close !== undefined) {
            this.onClose(e);
        }
    }

    setTitle(title) {
        this.setState("title", title);
    }
};
