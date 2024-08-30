import Utils from "#lib/componentUtils";
import languages from "#etc/languages.json";

export default class {
    async onCreate(input, out) {
        this.state = {
            langOpen: false,
        };
        this.siteId = out.global.siteId;
        this.language = out.global.language;
        this.utils = new Utils(this, this.language);
    }

    onMount() {
        window.addEventListener("click", (e) => {
            if (
                document.getElementById("hr_navbar_language") &&
                !document
                    .getElementById("hr_navbar_language")
                    .contains(e.target)
            ) {
                this.setState("langOpen", false);
            }
        });
    }

    onLanguageClick(e) {
        e.preventDefault();
        this.setState("langOpen", !this.state.langOpen);
    }

    onItemTopClick(e) {
        e.stopPropagation();
        e.preventDefault();
    }

    onLanguageItemClick(e) {
        e.preventDefault();
        const { lang } = e.target.closest("[data-lang]").dataset;
        window.__heretic = window.__heretic || {};
        window.__heretic.routingStop = true;
        window.location.href =
            lang === Object.keys(languages)[0]
                ? this.getCurrentURL()
                : `/${lang}${this.getCurrentURL()}`;
    }

    getCurrentURL() {
        if (!process.browser) {
            return "/";
        }
        return this.utils.getNonLocalizedURL(window.location.pathname).url;
    }
}
