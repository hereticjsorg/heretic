module.exports = class {
    onCreate(input) {
        this.state = {
            isActive: !!input.active,
        };
    }

    setActive(flag) {
        this.setState("isActive", flag);
    }
};
