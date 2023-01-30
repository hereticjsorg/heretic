module.exports = class {
    async onCreate(input) {
        if (input.admin) {
            await import(/* webpackChunkName: "hadmin-title-admin" */ "./style-admin.scss");
        } else {
            await import(/* webpackChunkName: "hadmin-title-frontend" */ "./style-frontend.scss");
        }
    }
};
