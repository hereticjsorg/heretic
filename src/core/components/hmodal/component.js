module.exports = class {
    onCreate(input) {
        this.state = {
            active: input.active,
            closeAllowed: true,
            loading: false,
        };
    }

    setActive(flag) {
        this.setState("active", flag);
        return this;
    }

    setCloseAllowed(flag) {
        this.setState("closeAllowed", flag);
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
};
