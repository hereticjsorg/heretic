import Utils from "#lib/componentUtils.js";

export default class {
    async onCreate(input) {
        this.state = {
            active: input.active,
            message: input.message || "",
            messageUnsafe: input.messageUnsafe || "",
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
        if (e.key === "Escape" && this.state.active) {
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

    onClose(e) {
        e.preventDefault();
        this.setActive(false);
    }

    onBackgroundClick(e) {
        e.preventDefault();
        this.onClose(e);
    }

    onConfirmClick(e) {
        e.preventDefault();
        this.onClose(e);
        this.emit("confirm");
    }

    setMessage(message, messageUnsafe) {
        this.setState("message", message);
        if (messageUnsafe) {
            this.setState("messageUnsafe", messageUnsafe);
        }
    }
}
