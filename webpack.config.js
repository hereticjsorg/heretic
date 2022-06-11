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
const WebpackUtils = require("./webpack.utils");

// A dirty one-liner hack for webpack error during Fastify build
fs.writeFileSync(path.resolve(__dirname, "node_modules", "fastify", "lib", "error-serializer.js"), fs.readFileSync(path.resolve(__dirname, "node_modules", "fastify", "lib", "error-serializer.js"), "utf8").replace(/return \$main/, ""));

module.exports = (env, argv) => {
    const markoPlugin = new MarkoPlugin();
    const webpackUtils = new WebpackUtils(argv.mode === "production");
    webpackUtils.generateI18nLoader();
    webpackUtils.generatePagesLoader();
    webpackUtils.generatePagesBuildConfigs();
    webpackUtils.generateI18nNavigation();
    webpackUtils.generateSitemap();
    webpackUtils.generateManifest();
    webpackUtils.generateServerData();
    webpackUtils.generateLangSwitchComponents();
    webpackUtils.generateListAPI();
    webpackUtils.copyDataDir();
    return ([{
            context: path.resolve(`${__dirname}`),
            name: "Frontend",
            target: ["web", "es5"],
            output: {
                path: path.resolve(__dirname, "dist", "public", "heretic"),
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
                                        config: path.resolve(__dirname, "postcss.config.js"),
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
                extensions: [".js", ".json", ".marko", ".fnt"]
            },
            module: {
                rules: [{
                    test: /\.s?css$/,
                    loader: "ignore-loader"
                }, {
                    test: /\.marko$/,
                    loader: "@marko/webpack/loader"
                }, {
                    test: /\.(png|jpg|svg)(\?v=\d+\.\d+\.\d+)?$/,
                    type: "asset/resource",
                    generator: {
                        filename: "asset.[contenthash:8][ext]",
                        publicPath: "/heretic/",
                        outputPath: "public/heretic/",
                    }
                }, {
                    test: /\.(ttf)(\?v=\d+\.\d+\.\d+)?$/,
                    type: "asset/inline",
                }]
            },
            target: "async-node",
            // externals: [/^[^./!]/],
            externals: [],
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
                path: path.resolve(__dirname, "dist"),
                filename: "server.js",
                publicPath: "/heretic/",
            },
            plugins: [
                new webpack.DefinePlugin({
                    "process.browser": undefined,
                    "process.env.BUNDLE": true,
                    "typeof window": "'undefined'",
                }),
                new webpack.optimize.LimitChunkCountPlugin({
                    maxChunks: 1
                }),
                markoPlugin.server,
            ],
            node: {
                __dirname: false,
            }
        }
    ]);
};
