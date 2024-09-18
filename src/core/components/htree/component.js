module.exports = class {
    async onCreate(input) {
        this.state = {
            selected: null,
            drag: false,
        };
        if (input.admin) {
            await import(
                /* webpackChunkName: "hselect-admin" */ "./style-admin.scss"
            );
        } else {
            await import(
                /* webpackChunkName: "hselect-frontend" */ "./style-frontend.scss"
            );
        }
    }

    onItemClick(data) {
        this.setState("selected", data.id);
    }

    onRootItemClick(e) {
        e.preventDefault();
        this.setState("selected", null);
    }

    onDragStart() {
        this.setState("drag", true);
    }

    onDragEnd() {
        this.setState("drag", false);
    }
};
