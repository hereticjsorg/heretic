import Utils from "#lib/componentUtils";

export default class {
    async onCreate(input, out) {
        if (process.browser) {
            window.__heretic = window.__heretic || {};
        }
        this.state = {
            ready: !process.browser,
            contentData: process.browser ? window.__heretic.contentData : out.global.contentData,
        };
        this.language = out.global.language;
        this.siteTitle = out.global.siteTitle;
        this.title = out.global.title;
        if (process.browser) {
            window.__heretic = window.__heretic || {};
            window.__heretic.contentData = window.__heretic.contentData || out.global;
            this.language = this.language || window.__heretic.outGlobal.language;
            this.siteTitle = out.global.siteTitle || window.__heretic.outGlobal.siteTitle;
            this.title = out.global.title && out.global.title[this.language] ? out.global.title[this.language] : window.__heretic.contentData.title;
            document.title = `${this.title} – ${this.siteTitle}`;
        }
        this.utils = new Utils(this, this.language);
    }

    async onMount() {
        await this.utils.waitForLanguageData();
        this.setState("ready", true);
    }
}
