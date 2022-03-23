const path = require("path");
const fs = require("fs-extra");
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MarkoPlugin = require("@marko/webpack/plugin").default;
const babelConfig = require("./babel.config");

const languages = fs.readJSONSync(path.resolve(__dirname, "etc", "languages.json"));

fs.removeSync(path.resolve(__dirname, "dist"));
const markoPlugin = new MarkoPlugin();

fs.ensureDirSync(path.resolve(__dirname, "src", "build"));
fs.writeFileSync(path.resolve(__dirname, "src", "build", "i18n-loader.js"), `module.exports = {
    loadLanguageFile: async lang => {
        let translationCore;
        let translationUser;
        switch (lang) {
${Object.keys(languages).map(l => `        case "${l}":
            translationCore = await import(/* webpackChunkName: "lang-core-${l}" */ "../translations/core/${l}.json");
            translationUser = await import(/* webpackChunkName: "lang-${l}" */ "../translations/${l}.json");
            break;
`).join("")}        default:
            return null;
        }
        return {
            ...translationCore,
            ...translationUser
        };
    },
};\n`, "utf8");
fs.writeFileSync(path.resolve(__dirname, "src", "build", "pages-loader.js"), `module.exports = {
    loadComponent: async route => {
        switch (route) {
${fs.readdirSync(path.resolve(__dirname, "src", "pages")).map(p => `        case "${p}":
            return import(/* webpackChunkName: "page.${p}" */ "../pages/${p}/index.marko");
`).join("")}        default:
            return import(/* webpackChunkName: "page.404" */ "../errors/404/index.marko");
        }
    },
};\n`, "utf8");

const pagesMeta = [];
fs.readdirSync(path.resolve(__dirname, "src", "pages")).map(p => {
    try {
        const meta = fs.readJSONSync(path.resolve(__dirname, "src", "pages", p, "meta.json"));
        pagesMeta.push(meta);
    } catch {
        // OK
    }
});
const routes = [];
const translations = [];
pagesMeta.map(i => {
    routes.push({
        id: i.id,
        path: i.path,
    });
    translations.push({
        id: i.id,
        title: i.title,
        description: i.description,
    });
});
fs.writeJSONSync(path.resolve(__dirname, "src", "build", "routes.json"), routes, {
    spaces: "\t",
});
fs.writeJSONSync(path.resolve(__dirname, "src", "build", "translations.json"), translations, {
    spaces: "\t",
});

module.exports = (env, argv) => ([{
        context: path.resolve(`${__dirname}`),
        name: "Frontend",
        target: ["web", "es5"],
        output: {
            path: path.resolve(__dirname, "dist", "public"),
            filename: "[name].[fullhash:8].js"
        },
        devtool: argv.mode === "production" ? false : "inline-source-map",
        module: {
            rules: [{
                    test: /\.(woff(2)?|ttf|eot|otf|png|jpg|svg)(\?v=\d+\.\d+\.\d+)?$/,
                    type: "asset/resource",
                    generator: {
                        filename: "asset.[contenthash:8][ext]"
                    }
                }, {
                    test: /\.(css|scss|sass)$/,
                    use: [{
                            loader: argv.mode === "production" ? MiniCssExtractPlugin.loader : "style-loader",
                        }, {
                            loader: "css-loader",
                            options: {
                                importLoaders: 1,
                                sourceMap: false,
                                url: true,
                            }
                        },
                        {
                            loader: "postcss-loader",
                            options: {
                                postcssOptions: {
                                    config: path.resolve(`${__dirname}/postcss.config.js`),
                                },
                            },
                        },
                        {
                            loader: "sass-loader"
                        },
                    ].filter(i => i !== null)
                },
                {
                    test: /\.marko$/,
                    loader: "@marko/webpack/loader",
                    options: {
                        babelConfig: {
                            ...babelConfig(),
                        }
                    }
                },
                {
                    test: /\.js$/,
                    loader: "babel-loader",
                    options: {
                        cacheDirectory: true,
                        ...babelConfig()
                    }
                }
            ]
        },
        optimization: {
            splitChunks: {
                chunks: "all",
                maxInitialRequests: 3,
                cacheGroups: {
                    defaultVendors: {
                        test: /[\\/]node_modules[\\/]/,
                        priority: -10,
                        reuseExistingChunk: true,
                        filename: "npm.[chunkhash].js",
                    },
                    style: {
                        name: "style",
                        test: /style\.s?css$/,
                        chunks: "all",
                        enforce: true,
                        minChunks: 2,
                        filename: "style.[fullhash:8].js",
                    },
                    default: {
                        minChunks: 2,
                        priority: -20,
                        reuseExistingChunk: true,
                    },
                }
            },
            usedExports: true,
            minimizer: argv.mode === "production" ? [
                new TerserPlugin({
                    parallel: true,
                    extractComments: false,
                    terserOptions: {
                        format: {
                            comments: false,
                        },
                    },
                }),
                new CssMinimizerPlugin({
                    minimizerOptions: {
                        preset: [
                            "default",
                            {
                                discardComments: {
                                    removeAll: true
                                },
                            },
                        ],
                    },
                }),
            ] : []
        },
        plugins: [
            new webpack.DefinePlugin({
                "typeof window": "'object'",
                "process.browser": true
            }),
            argv.mode === "production" ? new MiniCssExtractPlugin({
                filename: "[name].[fullhash:8].css",
                experimentalUseImportModule: true,
            }) : () => {},
            argv.mode === "production" ? new CompressionPlugin() : () => {},
            new CopyWebpackPlugin({
                patterns: fs.readdirSync(path.resolve(__dirname, "src", "static")).map(f => ({
                    from: `./src/static/${f}`
                })),
            }),
            markoPlugin.browser,
        ],
    },
    {
        name: "Backend",
        context: path.resolve(`${__dirname}`),
        devtool: argv.mode === "production" ? false : "eval",
        resolve: {
            extensions: [".js", ".json", ".marko"]
        },
        module: {
            rules: [{
                test: /\.s?css$/,
                loader: "ignore-loader"
            }, {
                test: /\.marko$/,
                loader: "@marko/webpack/loader"
            }, {
                test: /\.(woff(2)?|ttf|eot|otf|png|jpg|svg)(\?v=\d+\.\d+\.\d+)?$/,
                type: "asset/resource",
                generator: {
                    filename: "asset.[contenthash:8][ext]",
                    publicPath: "/",
                    outputPath: "public/",
                }
            }]
        },
        target: "async-node",
        externals: [/^[^./!]/],
        optimization: argv.mode === "production" ? {
            splitChunks: false,
            minimizer: [
                new TerserPlugin({
                    parallel: true,
                    extractComments: false,
                    terserOptions: {
                        format: {
                            comments: false,
                        },
                    },
                })
            ]
        } : {},
        output: {
            hashFunction: "xxhash64",
            libraryTarget: "commonjs2",
            path: path.resolve(`${__dirname}/dist`),
            filename: "server.js",
            publicPath: "/",
        },
        plugins: [
            new webpack.DefinePlugin({
                "process.browser": undefined,
                "process.env.BUNDLE": true,
                "typeof window": "'undefined'"
            }),
            new webpack.optimize.LimitChunkCountPlugin({
                maxChunks: 1
            }),
            markoPlugin.server,
        ]
    }
]);
