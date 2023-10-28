import debounce from "lodash.debounce";
import Utils from "#lib/componentUtils";

export default class {
    async onCreate(input, out) {
        this.state = {};
        this.language = out.global.language;
        if (process.browser) {
            window.__heretic = window.__heretic || {};
            window.__heretic.outGlobal = window.__heretic.outGlobal || out.global || {};
            this.language = this.language || window.__heretic.outGlobal.language;
        }
    }

    onWindowScroll() {
        const scrollWrap = document.getElementById(`hr_ft_scroll_wrap_${this.input.id}`);
        scrollWrap.style.position = "unset";
        scrollWrap.style.bottom = "unset";
        if (this.utils.isElementInViewport(scrollWrap)) {
            scrollWrap.style.position = "unset";
            scrollWrap.style.bottom = "unset";
        } else {
            scrollWrap.style.position = "fixed";
            scrollWrap.style.bottom = 0;
        }
    }

    onScroll() {
        const scrollWrap = document.getElementById(`hr_ft_scroll_wrap_${this.input.id}`);
        this.emit("wrap-scroll", scrollWrap.scrollLeft);
    }

    async onMount() {
        this.utils = new Utils(this, this.language);
        this.onWindowScrollDebounced = debounce(this.onWindowScroll.bind(this), 100);
        await this.utils.waitForElement(`hr_ft_scroll_wrap_${this.input.id}`);
        const scrollWrap = document.getElementById(`hr_ft_scroll_wrap_${this.input.id}`);
        scrollWrap.addEventListener("scroll", this.onScroll.bind(this));
        window.addEventListener("scroll", this.onWindowScrollDebounced.bind(this));
        this.onWindowScroll();
    }

    async setWrapWidth(w) {
        // await this.utils.waitForElement(`hr_ft_scroll_wrap_${this.input.id}`);
        const scrollWrap = document.getElementById(`hr_ft_scroll_wrap_${this.input.id}`);
        scrollWrap.style.width = `${w}px`;
    }

    async setInnerWidth(w) {
        // await this.utils.waitForElement(`hr_ft_scroll_inner_${this.input.id}`);
        const scrollInner = document.getElementById(`hr_ft_scroll_inner_${this.input.id}`);
        scrollInner.style.width = `${w}px`;
    }

    async setDisplay(d) {
        // await this.utils.waitForElement(`hr_ft_scroll_wrap_${this.input.id}`);
        const scrollWrap = document.getElementById(`hr_ft_scroll_wrap_${this.input.id}`);
        scrollWrap.style.display = d;
    }

    setScrollLeft(v) {
        const scrollWrap = document.getElementById(`hr_ft_scroll_wrap_${this.input.id}`);
        scrollWrap.scrollLeft = v;
    }
}
