module.exports = class {
    pageClick(e) {
        e.preventDefault();
        const { page } = e.target.closest("[data-page]").dataset;
        this.emit("page-click", page);
    }
};
