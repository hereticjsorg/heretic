const Utils = require("../../../../../src/core/lib/componentUtils").default;

module.exports = class {
    async onCreate(input, out) {
        this.state = {
            authOpen: false,
        };
        this.siteId = out.global.siteId;
        this.language = out.global.language;
        this.utils = new Utils(this, this.language);
    }

    onMount() {
        window.addEventListener("click", e => {
            if (document.getElementById("hr_navbar_auth") && !document.getElementById("hr_navbar_auth").contains(e.target)) {
                this.setState("authOpen", false);
            }
        });
    }

    onAuthClick(e) {
        e.preventDefault();
        this.setState("authOpen", !this.state.authOpen);
    }
};
