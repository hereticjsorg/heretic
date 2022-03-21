module.exports = class {
    onCreate() {
        this.state = {
            isActive: false,
        };
    }

    setActive(flag) {
        this.setState("isActive", flag);
    }
};
