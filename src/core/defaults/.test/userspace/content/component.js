const meta = require("../../page.json");

module.exports = class {
    onCreate(input, out) {
        this.language = out.global.language;
        this.siteTitle = out.global.siteTitle;
        if (process.browser && window.__heretic && window.__heretic.t) {
            document.title = `${meta.title[this.language]} | ${this.siteTitle}`;
        }
    }
};
