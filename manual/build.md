# Build Process

Heretic uses *Webpack*, a static module bundler for modern JavaScript applications. There are two build modes in Heretic: *build-dev* and *build-production*.

## build-dev

During build process, Heretic creates a *./dist* directory which contains everything you need to run your website (static bundles, server script etc.). There are following stages of website build:

* generate internationalization loader to fetch translation files dynamically (*./src/build/i18n-loader.js*)
* generate pages loader used by SPA mode used to load data without page reload (*./src/build/pages-loader.js*)
* generate configuration files used by build script (saved to *./src/build* directory)
* generate *sitemap.xml* file based on pages configuration
* generate *site.webmanifest* (saved to *./src/static/site.webmanifest* directory)
* generate *&lt;lang-switch/&gt;* components for each page where *langSwitchComponent* parameter is set to *true*
* generate bundles and static assets (saved to *./dist/public*)
* generate script to run as a web server (saved to *./dist/server.js*)

The following directories are deleted and re-created every time you start the build process: *./dist*, *./src/build*.

In *build-dev* mode:

* *inline-source-map* is used as devtool
* *style-loader* is used as loader for CSS, SCSS or SASS files
* no code is minimized for build performance reasons
* no compression plugin is used (static assets and bundles are not compressed)

## build-production

This mode is intended to prepare your website to run in production mode. It has some extra optimizations so it's slower as *build-dev* mode and must be used when you're ready to publish your website.

In *build-production* mode:

* not using any devtool
* *MiniCssExtractPlugin* is used as loader for CSS, SCSS or SASS files
* *TerserPlugin* and *CssMinimizerPlugin* plugins are used to minimize JS code and CSS styles
* *CompressionPlugin* is used to generate GZ files to load website faster