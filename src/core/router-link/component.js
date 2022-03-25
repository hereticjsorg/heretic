module.exports = class {
    onCreate(input, out) {
        this.language = out.global.language;
    }

    navigate(e) {
        e.preventDefault();
        const {
            language
        } = window.__heretic.router.getLocationData();
        // document.title = `${window.__heretic.t(this.input.route)} | ${window.__heretic.t("title")}`;
        window.__heretic.router.navigate(this.input.route, language);
    }
};
