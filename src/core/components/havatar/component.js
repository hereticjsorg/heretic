module.exports = class {
    async onCreate(input) {
        this.state = {
            active: false,
        };
        if (input.admin) {
            await import(/* webpackChunkName: "havatar-admin" */ "./style-admin.scss");
        } else {
            await import(/* webpackChunkName: "havatar-frontend" */ "./style-frontend.scss");
        }
    }

    async show() {

    }
};
