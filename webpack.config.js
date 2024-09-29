const path = require("path");
const fs = require("fs-extra");
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const ESLintPlugin = require("eslint-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MarkoPlugin = require("@marko/webpack/plugin").default;
const WebpackUtils = require("./webpack.utils.js");
const babelConfig = require("./babel.config");
const systemConfig = require("./site/etc/system.js");

module.exports = async (env, argv) => {
    const markoPlugin = new MarkoPlugin();
    const webpackUtils = new WebpackUtils(argv.mode === "production");
    webpackUtils.initDirectories();
    await webpackUtils.processMetaJson();
    await webpackUtils.generateConfig();
    webpackUtils.processBinScript();
    webpackUtils.generateLoaders();
    webpackUtils.generateAdminIconsComponent();
    webpackUtils.generateSitemap();
    webpackUtils.generateManifest();
    webpackUtils.generateLangSwitchComponents();
    await webpackUtils.processMarkoJson();
    await webpackUtils.processJunkFiles();
    return [
        {
            context: path.resolve(`${__dirname}`),
            performance: {
                maxEntrypointSize: 10485760, // 10 MB
                maxAssetSize: 52428800, // 50 MB
            },
            name: "Userspace",
            target: ["web", "es5"],
            output: {
                path: path.resolve(__dirname, "dist.new", "public", "heretic"),
                filename: "[name].[fullhash:8].js",
            },
            devtool: argv.mode === "production" ? false : "inline-source-map",
            module: {
                rules: [
                    {
                        test: /\.tsx?$/,
                        use: [
                            {
                                loader: "ts-loader",
                                options: {
                                    exclude: /node_modules/,
                                },
                            },
                        ],
                    },
                    {
                        test: /\.(woff(2)?|ttf|eot|otf|png|jpg|jpeg|svg|mp4|webm|mp3)(\?v=\d+\.\d+\.\d+)?$/,
                        type: "asset/resource",
                        generator: {
                            filename: "asset.[contenthash:8][ext]",
                        },
                    },
                    {
                        test: /\.(css|scss|sass)$/,
                        use: [
                            {
                                loader:
                                    argv.mode === "production"
                                        ? MiniCssExtractPlugin.loader
                                        : "style-loader",
                            },
                            {
                                loader: "css-loader",
                                options: {
                                    importLoaders: 1,
                                    sourceMap: false,
                                    url: true,
                                },
                            },
                            {
                                loader: "postcss-loader",
                                options: {
                                    postcssOptions: {
                                        config: path.resolve(
                                            __dirname,
                                            "postcss.config.js",
                                        ),
                                    },
                                },
                            },
                            {
                                loader: "sass-loader",
                                options: {
                                    sassOptions: {
                                        quietDeps: true,
                                    },
                                },
                            },
                        ].filter((i) => i !== null),
                    },
                    {
                        test: /\.marko$/,
                        use: [
                            {
                                loader: "@marko/webpack/loader",
                                options: {
                                    babelConfig: {
                                        ...babelConfig(),
                                    },
                                },
                            },
                        ],
                    },
                    {
                        test: /\.js$/,
                        exclude: /node_modules/,
                        use: [
                            {
                                loader: "babel-loader",
                                options: {
                                    cacheDirectory: true,
                                    ...babelConfig(),
                                },
                            },
                        ],
                    },
                ],
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
                            filename: (data) => {
                                if (argv.mode === "production") {
                                    return `heretic.${data.chunk.id}.[fullhash:8].js`;
                                }
                                const nameArr = data.chunk.id.split(/_/);
                                return nameArr.length > 4
                                    ? `heretic.${nameArr[nameArr.length - 3]}.${nameArr[nameArr.length - 2]}.${data.chunk.renderedHash}.[fullhash:8].js`
                                    : `heretic.generic.${data.chunk.renderedHash}.[fullhash:8].js`;
                                // return `heretic.${data.chunk.renderedHash}.[fullhash:8].js`;
                            },
                        },
                    },
                    hidePathInfo: true,
                },
                usedExports: true,
                minimizer:
                    argv.mode === "production"
                        ? [
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
                                                  removeAll: true,
                                              },
                                          },
                                      ],
                                  },
                              }),
                          ]
                        : [],
            },
            plugins: [
                new webpack.DefinePlugin({
                    "typeof window": "'object'",
                    "process.browser": true,
                }),
                argv.mode === "production"
                    ? new MiniCssExtractPlugin({
                          filename: "[name].[fullhash:8].css",
                          experimentalUseImportModule: true,
                          ignoreOrder: true,
                      })
                    : () => {},
                argv.mode === "production" &&
                systemConfig.buildOptions &&
                systemConfig.buildOptions.productionCompress
                    ? new CompressionPlugin()
                    : () => {},
                new CopyWebpackPlugin({
                    patterns: fs
                        .readdirSync(
                            path.resolve(__dirname, "site", "static", "public"),
                        )
                        .map((f) => ({
                            from: `./site/static/public/${f}`,
                        })),
                }),
                markoPlugin.browser,
                new ESLintPlugin({
                    failOnError: true,
                    failOnWarning: true,
                }),
            ],
            resolve: {
                alias: {
                    fonts: path.join(__dirname, "src/core/fonts"),
                    siteFonts: path.join(__dirname, "site/fonts"),
                    styles: path.join(__dirname, "src/core/styles"),
                    view: path.join(__dirname, "site/view"),
                    bulma: path.join(__dirname, "node_modules/bulma"),
                },
                extensions: [".tsx", ".ts", ".js"],
            },
            cache: {
                type: "filesystem",
                allowCollectingMemory: true,
                cacheDirectory: path.resolve(__dirname, ".cache"),
            },
        },
        {
            name: "Backend",
            context: path.resolve(`${__dirname}`),
            devtool: argv.mode === "production" ? false : "eval",
            resolve: {
                extensions: [".js", ".json", ".marko", ".fnt", ".tsx", ".ts"],
            },
            module: {
                rules: [
                    {
                        test: /\.(txt|sh)$/,
                        type: "asset/source",
                    },
                    {
                        test: /\.tsx?$/,
                        use: [
                            {
                                loader: "ts-loader",
                            },
                        ],
                        exclude: /node_modules/,
                    },
                    {
                        test: /\.(s?css|mp3|webm|mp4)$/,
                        use: [
                            {
                                loader: "ignore-loader",
                            },
                        ],
                    },
                    {
                        test: /\.marko$/,
                        use: [
                            {
                                loader: "@marko/webpack/loader",
                            },
                        ],
                    },
                    {
                        test: /\.(png|jpg|jpeg|svg)(\?v=\d+\.\d+\.\d+)?$/,
                        type: "asset/resource",
                        generator: {
                            filename: "asset.[contenthash:8][ext]",
                            publicPath: "/heretic/",
                            outputPath: "public/heretic/",
                        },
                    },
                    {
                        test: /\.(ttf)(\?v=\d+\.\d+\.\d+)?$/,
                        type: "asset/inline",
                    },
                ],
            },
            target: "async-node",
            externals: ["mongodb", "argon2", "systeminformation", "sharp", "archiver"],
            optimization:
                argv.mode === "production"
                    ? {
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
                              }),
                          ],
                      }
                    : {},
            output: {
                hashFunction: "xxhash64",
                libraryTarget: "commonjs2",
                path: path.resolve(__dirname, "dist.new"),
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
                    maxChunks: 1,
                }),
                markoPlugin.server,
                new ESLintPlugin({
                    failOnError: true,
                    failOnWarning: true,
                }),
            ],
            node: {
                __dirname: false,
            },
            cache: {
                type: "filesystem",
                allowCollectingMemory: true,
                cacheDirectory: path.resolve(__dirname, ".cache"),
            },
        },
    ];
};
