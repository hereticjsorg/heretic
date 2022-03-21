module.exports = class {
    async onCreate() {
        const state = {
            iconWrapOpacity: 0,
        };
        this.state = state;
        await import(/* webpackChunkName: "error500" */ "./error500.scss");
    }

    onMount() {
        setTimeout(() => this.setState("iconWrapOpacity", 1), 100);
    }
};
