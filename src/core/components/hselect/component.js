module.exports = class {
    async onCreate(input) {
        this.state = {
            items: {},
            selected: [],
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

    setItems(items, selected = []) {
        this.setState("items", items);
        this.setState("selected", selected);
    }

    setSelected(items) {
        this.setState("selected", items);
    }

    getSelected() {
        return this.state.selected;
    }

    onCheckboxChange(e) {
        e.preventDefault();
        const { checked } = e.target;
        const { id } = e.target.closest("[data-id]").dataset;
        let { selected } = this.state;
        if (checked) {
            if (selected.indexOf(id) === -1) {
                selected.push(id);
            }
        } else {
            selected = selected.filter((i) => i !== id);
        }
        this.setState("selected", selected);
    }
};
