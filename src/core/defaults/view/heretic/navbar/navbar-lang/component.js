const Utils = require("../../../../../src/core/lib/componentUtils").default;

module.exports = class {
    async onCreate(input, out) {
        this.state = {
            langOpen: false,
        };
        this.siteId = out.global.siteId;
        this.language = out.global.language;
        this.utils = new Utils(this, this.language);
    }

    onMount() {
        window.addEventListener("click", e => {
            if (document.getElementById("hr_navbar_language") && !document.getElementById("hr_navbar_language").contains(e.target)) {
                this.setState("langOpen", false);
            }
        });
    }

    onLanguageClick(e) {
        e.preventDefault();
        this.setState("langOpen", !this.state.langOpen);
    }
};
