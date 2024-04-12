module.exports = {
    plugins: {
        "postcss-url": {},
        "postcss-preset-env": {
            browsers: "last 2 versions",
            stage: 2,
            preserve: true,
        },
        "postcss-csso": {
            restructure: true,
            debug: false,
            sourceMap: false,
        },
    },
};
