module.exports = api => {
    if (api) {
        api.cache(true);
    }
    return {
        sourceType: "unambiguous",
        plugins: [
            "@babel/plugin-transform-class-properties",
            "@babel/plugin-transform-object-rest-spread",
            "@babel/plugin-transform-async-to-generator",
            "@babel/plugin-syntax-import-assertions",
            ["@babel/transform-runtime", {
                regenerator: true,
                useESModules: true,
            }]
        ],
        presets: [
            [
                "@babel/preset-env",
                {
                    targets: {
                        chrome: "58",
                    }
                }
            ]
        ],
    };
};
