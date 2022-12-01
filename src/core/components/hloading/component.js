const store = require("store2");

module.exports = class {
    onCreate(input, out) {
        this.state = {
            isActive: !!input.active,
        };
        this.siteId = out.global.siteId;
    }

    onMount() {
        this.store = store.namespace(`heretic_${this.siteId}`);
        const darkMode = !!this.store.get("darkMode");
        document.documentElement.classList[darkMode ? "add" : "remove"]("heretic-dark");
        document.documentElement.style.transition = "all 0.6s ease";
    }

    setActive(flag) {
        this.setState("isActive", flag);
    }
};
