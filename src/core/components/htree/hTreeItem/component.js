module.exports = class {
    async onCreate() {
        this.state = {
            overGap: null,
        };
    }

    onItemClick(e) {
        e.preventDefault();
        this.emit("item-click", this.input.data);
    }

    onSubItemClick(data) {
        this.emit("item-click", data);
    }

    onSubItemDrop(data) {
        this.emit("itemdrop", data);
    }

    onItemDragStart(e) {
        const { id } = e.target.closest("[data-id]").dataset;
        e.dataTransfer.setData("text/plain", `__htr__${this.input.id}_${id}`);
        this.emit("drag-start");
    }

    onItemDragEnd() {
        this.emit("drag-end");
    }

    onChildDragStart() {
        this.emit("drag-start");
    }

    onChildDragEnd() {
        this.emit("drag-end");
    }

    onGapDragOver(e) {
        e.preventDefault();
    }

    onDrag(e) {
        if (this.input.scroll) {
            const parent = document.getElementById(
                `hr_htr_${this.input.id}`,
            ).parentElement;
            const parentRect = parent.getBoundingClientRect();
            const y = e.clientY;
            if (y < parentRect.y && parent.scrollTop > 0) {
                parent.scrollTop -= 5;
            } else if (y > parentRect.y + parentRect.height) {
                parent.scrollTop += 5;
            }
        }
    }

    onGapDragEnter(e) {
        e.preventDefault();
        const { id } = e.target.closest("[data-id]").dataset;
        this.setState("overGap", id);
    }

    onGapDragLeave(e) {
        e.preventDefault();
        this.setState("overGap", null);
    }

    onGapDrop(e) {
        if (
            !e.dataTransfer.getData("text/plain") ||
            !e.dataTransfer.getData("text/plain").match(/^__htr__/)
        ) {
            e.preventDefault();
            return;
        }
        const [, itemId] = e.dataTransfer
            .getData("text/plain")
            .replace(/^__htr__/, "")
            .split(/_/);
        this.emit("itemdrop", {
            src: itemId,
            dest: this.input.data.id,
            position: this.state.overGap,
        });
        this.setState("overGap", null);
    }

    onTreeToggleClick(e) {
        if (e && e.target) {
            const { id } = e.target.closest("[data-id]").dataset;
            this.emit("treetoggle", id);
        } else if (typeof e === "string") {
            this.emit("treetoggle", e);
        }
    }
};
