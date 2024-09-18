module.exports = class {
    async onCreate() {
        this.state = {};
    }

    onItemClick(e) {
        e.preventDefault();
        this.emit("item-click", this.input.data);
    }

    onSubItemClick(data) {
        this.emit("item-click", data);
    }

    onItemDragStart(e) {
        // eslint-disable-next-line no-console
        console.log("onItemDragStart");
        e.dataTransfer.setData("text/plain", `__htr__${this.input.id}_${this.input.data.id}`);
        this.emit("drag-start");
    }

    onItemDragEnd() {
        // eslint-disable-next-line no-console
        console.log("onItemDragEnd");
        this.emit("drag-end");
    }

    onChildDragStart() {
        this.emit("drag-start");
    }

    onChildDragEnd() {
        this.emit("drag-end");
    }
};
