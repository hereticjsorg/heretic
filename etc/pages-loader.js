module.exports = {
    loadComponent: async route => {
        switch (route) {
        case "home":
            return import(/* webpackChunkName: "page.home" */ "../src/pages/home/index.marko");
        case "test":
            return import(/* webpackChunkName: "page.test" */ "../src/pages/test/index.marko");
        default:
            return import(/* webpackChunkName: "page.404" */ "../src/errors/404/index.marko");
        }
    },
};
