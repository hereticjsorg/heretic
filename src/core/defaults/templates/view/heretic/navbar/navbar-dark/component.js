import store from "store2";
import Utils from "#lib/componentUtils";

export default class {
    async onCreate(input, out) {
        this.state = {
            darkMode: false,
        };
        this.siteId = out.global.siteId;
        this.language = out.global.language;
        this.utils = new Utils(this, this.language);
    }

    onMount() {
        this.store = store.namespace(`heretic_${this.siteId}`);
        const darkMode = !!this.store.get("darkMode");
        this.setState("darkMode", darkMode);
        this.emit("dark-mode", darkMode);
    }

    onDarkModeSwitchClick(e) {
        e.preventDefault();
        const darkMode = !this.state.darkMode;
        this.store.set("darkMode", darkMode);
        this.setState("darkMode", darkMode);
        document.documentElement.classList[darkMode ? "add" : "remove"]("heretic-dark");
        this.utils.setDarkTheme(darkMode);
        this.emit("dark-mode", darkMode);
    }
}
