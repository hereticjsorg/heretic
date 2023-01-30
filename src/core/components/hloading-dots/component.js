module.exports = class {
    async onCreate(input) {
        if (input.admin) {
            await import(/* webpackChunkName: "hloading-dots-admin" */ "./style-admin.scss");
        } else {
            await import(/* webpackChunkName: "hloading-dots-frontend" */ "./style-frontend.scss");
        }
    }
};
