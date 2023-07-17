module.exports = class {
    async onCreate(input) {
        this.state = {
            darkMode: input.darkMode,
        };
    }

    setDarkMode(flag) {
        this.setState("darkMode", flag);
    }
};
