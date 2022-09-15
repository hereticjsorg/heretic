module.exports = class {
    onCreate() {
        this.state = {
            items: {},
            selected: [],
        };
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
        const {
            id
        } = e.target.closest("[data-id]").dataset;
        let { selected } = this.state;
        if (checked) {
            if (selected.indexOf(id) === -1) {
                selected.push(id);
            }
        } else {
            selected = selected.filter(i => i !== id);
        }
        this.setState("selected", selected);
    }
};
