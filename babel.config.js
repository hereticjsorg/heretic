module.exports = (api) => {
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
            [
                "@babel/transform-runtime",
                {
                    regenerator: true,
                    useESModules: true,
                },
            ],
            [
                "prismjs",
                {
                    languages: [
                        "javascript",
                        "css",
                        "c",
                        "cpp",
                        "csharp",
                        "markup",
                        "html",
                        "dart",
                        "typescript",
                        "perl",
                        "php",
                        "sql",
                        "json",
                        "java",
                        "bash",
                        "nginx",
                        "xml",
                        "haml",
                    ],
                    plugins: ["line-numbers"],
                    css: false,
                },
            ],
        ],
        presets: [
            [
                "@babel/preset-env",
                {
                    targets: {
                        chrome: "58",
                    },
                },
            ],
        ],
    };
};
