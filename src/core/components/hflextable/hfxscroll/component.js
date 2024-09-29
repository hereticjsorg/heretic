import debounce from "lodash/debounce";
import Utils from "#lib/componentUtils.js";

export default class {
    async onCreate(input, out) {
        this.state = {
            widthWrap: 0,
            widthInner: 0,
            vScrollWidth: 0,
            vScrollMoving: false,
            vScrollShift: 0,
            vScrollOffset: 0,
            vScrollPosition: 0,
        };
        if (input.admin) {
            await import(
                /* webpackChunkName: "hfxscroll-admin" */ "./style-admin.scss"
            );
        } else {
            await import(
                /* webpackChunkName: "hfxscroll-frontend" */ "./style-frontend.scss"
            );
        }
        this.language = out.global.language;
        if (process.browser) {
            window.__heretic = window.__heretic || {};
            window.__heretic.outGlobal =
                window.__heretic.outGlobal || out.global || {};
            this.language =
                this.language || window.__heretic.outGlobal.language;
        }
    }

    async onWindowScroll() {
        try {
            await this.utils.waitForElement(`hr_hfs_wrap_${this.input.id}`);
            const scrollWrap = document.getElementById(
                `hr_hfs_wrap_${this.input.id}`,
            );
            scrollWrap.style.position = "unset";
            scrollWrap.style.bottom = "unset";
            if (this.utils.isElementInViewport(scrollWrap)) {
                scrollWrap.style.position = "unset";
                scrollWrap.style.bottom = "unset";
                if (this.state.vScrollWidth) {
                    scrollWrap.style.marginBottom = "20px";
                }
            } else {
                scrollWrap.style.position = "fixed";
                scrollWrap.style.bottom = "10px";
                scrollWrap.style.marginBottom = "unset";
            }
        } catch (e) {
            //
        }
    }

    onScroll() {
        const scrollWrap = document.getElementById(
            `hr_hfs_scroll_wrap_${this.input.id}`,
        );
        this.emit("wrap-scroll", scrollWrap.scrollLeft);
    }

    async onMount() {
        this.utils = new Utils(this, this.language);
        this.onWindowScrollDebounced = debounce(
            this.onWindowScroll.bind(this),
            100,
        );
        await this.utils.waitForElement(`hr_hfs_scroll_wrap_${this.input.id}`);
        const scrollWrap = document.getElementById(
            `hr_hfs_scroll_wrap_${this.input.id}`,
        );
        scrollWrap.addEventListener("scroll", this.onScroll.bind(this));
        window.addEventListener(
            "scroll",
            this.onWindowScrollDebounced.bind(this),
        );
        window.addEventListener("mouseup", this.onVScrollMouseUp.bind(this));
        window.addEventListener(
            "mousemove",
            this.onVScrollMouseMove.bind(this),
        );
        this.onWindowScroll();
    }

    setVirtualScrollbar() {
        if (this.state.widthInner && this.state.widthWrap) {
            if (this.state.widthInner > this.state.widthWrap) {
                const sizeCoe = this.state.widthWrap / this.state.widthInner;
                const virtualScroll = document.getElementById(
                    `hr_hfs_vscroll_inner_${this.input.id}`,
                );
                if (virtualScroll) {
                    this.setState(
                        "vScrollWidth",
                        parseInt(this.state.widthWrap * sizeCoe, 10),
                    );
                    virtualScroll.style.width = `${this.state.vScrollWidth}px`;
                }
            } else {
                this.setState("vScrollWidth", 0);
            }
        }
    }

    async setWrapWidth(w) {
        const scrollWrap = document.getElementById(
            `hr_hfs_scroll_wrap_${this.input.id}`,
        );
        scrollWrap.style.width = `${w}px`;
        this.setState("widthWrap", w);
        this.setVirtualScrollbar();
    }

    async setInnerWidth(w) {
        const scrollInner = document.getElementById(
            `hr_hfs_scroll_inner_${this.input.id}`,
        );
        scrollInner.style.width = `${w}px`;
        this.setState("widthInner", w);
        this.setVirtualScrollbar();
    }

    async setDisplay(d) {
        const scrollWrap = document.getElementById(
            `hr_hfs_scroll_wrap_${this.input.id}`,
        );
        scrollWrap.style.display = d;
        this.setVirtualScrollbar();
    }

    setScrollLeft(v) {
        const scrollWrap = document.getElementById(
            `hr_hfs_scroll_wrap_${this.input.id}`,
        );
        scrollWrap.scrollLeft = v;
        const scrollInner = document.getElementById(
            `hr_hfs_vscroll_inner_${this.input.id}`,
        );
        const sizeCoe = this.state.widthWrap / this.state.widthInner;
        scrollInner.style.left = `${v * sizeCoe}px`;
    }

    onVScrollMouseDown(e) {
        e.preventDefault();
        const scrollWrap = document.getElementById(
            `hr_hfs_vscroll_wrap_${this.input.id}`,
        );
        const scrollInner = document.getElementById(
            `hr_hfs_vscroll_inner_${this.input.id}`,
        );
        this.setState(
            "vScrollOffset",
            scrollInner.getBoundingClientRect().left -
                scrollWrap.getBoundingClientRect().left,
        );
        this.setState("vScrollPosition", e.pageX);
        this.setState("vScrollMoving", true);
    }

    onVScrollMouseUp() {
        this.setState("vScrollMoving", false);
    }

    onVScrollMouseMove(e) {
        if (this.state.vScrollMoving) {
            e.preventDefault();
            const scrollInner = document.getElementById(
                `hr_hfs_vscroll_inner_${this.input.id}`,
            );
            let position =
                e.pageX - this.state.vScrollPosition + this.state.vScrollOffset;
            if (position < 0) {
                position = 0;
            }
            const scrollWrap = document.getElementById(
                `hr_hfs_vscroll_wrap_${this.input.id}`,
            );
            if (
                position + this.state.vScrollWidth >
                scrollWrap.getBoundingClientRect().width
            ) {
                position =
                    scrollWrap.getBoundingClientRect().width -
                    this.state.vScrollWidth;
            }
            scrollInner.style.left = `${position}px`;
            this.setState("vScrollOffset", position);
            this.setState("vScrollPosition", e.pageX);
            const sizeCoe = this.state.widthWrap / this.state.widthInner;
            this.emit("wrap-scroll", position / sizeCoe);
        }
    }
}
