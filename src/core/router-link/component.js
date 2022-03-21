const languagesList = require("../../../etc/languages.json");

module.exports = class {
    onCreate(input, out) {
        this.language = out.global.language;
    }

    navigate(e) {
        e.preventDefault();
		this.router = process.browser ? window.__heretic.router : null;
        this.routes = process.browser ? window.__heretic.routes : null;
        if (this.input.route && this.router && this.routes) {
            document.title = `${window.__heretic.t(this.input.route)} | ${window.__heretic.t("title")}`;
            this.router.navigate(this.input.route, this.input.params ? JSON.parse(this.input.params) : {} || {});
            const { pathServer } = this.routes.find(r => r.name === this.input.route);
            window.history.replaceState(null, document.title, this.language === Object.keys(languagesList)[0] ? pathServer : `/${this.language}${pathServer}`);
        } else {
            throw new Error(`Missing attribute "route" on router-link component`);
        }
    }
};
