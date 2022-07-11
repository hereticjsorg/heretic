module.exports = class {
    async onCreate() {
        const state = {
            panicMode: false,
        };
        this.state = state;
    }

    activatePanicMode() {
        this.setState("panicMode", true);
    }
};
