const Utils = require("../../../../../lib/componentUtils").default;
const moduleConfig = require("../../../admin.js");

module.exports = class {
    onCreate(input, out) {
        this.state = {};
        this.language = out.global.language;
        this.systemRoutes = out.global.systemRoutes;
        if (process.browser && window.__heretic && window.__heretic.t) {
            this.language = this.language || window.__heretic.outGlobal.language;
            this.systemRoutes = out.global.systemRoutes || window.__heretic.outGlobal.systemRoutes;
        }
        this.utils = new Utils(this, this.language);
    }

    onMount() {}

    onModalButtonClick() {}

    async getModal() {
        await this.utils.waitForComponent(`${moduleConfig.id}EditModal`);
        return this.getComponent(`${moduleConfig.id}EditModal`);
    }

    onFormButtonClick() {}

    onFormSubmit() {}
};
