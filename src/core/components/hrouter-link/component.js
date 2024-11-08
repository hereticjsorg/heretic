module.exports = class {
    onCreate(input, out) {
        this.language = out.global.language;
        this.navigation = out.global.navigation;
    }

    navigate(e) {
        e.preventDefault();
        const { language } = window.__heretic.router.getLocationData();
        window.__heretic.router.navigate(this.input.route, language);
    }
};
