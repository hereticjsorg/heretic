# Modules

In order to create a module, you will need to create a sub-directory under the *./site/modules* directory. You may wish either to start from scratch or to use a template.

## Using Module Template

You will need to copy the *./src/core/defaults/blank* directory to the *./site/modules* directory. Then:

* Rename the directory to match its contents (e.g. "test", *./site/modules/test*)
* Set module configuration in a *./site/modules/test/module.js* (it's mandatory to set the unique page ID and route path)
* Put the required contents to the *./site/modules/test/page/content/lang-xx-xx* directories (matching your languages)
* When necessary, add your page ID to the *./site/navigation.json* file (see [configuration files](./configurationFiles.md) for more info)

## Module Configuration

Each module is being configured using *module.js* file which located in module directory.

| Option | Description |
|--------|-------------|
| id | Unique ID of a module, used for routes and navigation |
| routes.userspace | Object of routes for userspace (e.g. { home: { path: "/home" } } ) |
| routes.admin | Object of routes for admin area (e.g. { home: { path: "/home" } } ) |

To change locale-specific options, you will need to edit the *meta.src.json* file located in every page's directory:

| Option | Description |
| title | Object containing page title for each language |
| description | Object containing page description for each language |

Additionally, you may wish to tell Heretic build script to include a page into *sitemap.xml* file which is built automatically. To change sitemap options for each page, you will need to edit the *sitemap.json* file:

| Option     | Description                                             |
|------------|---------------------------------------------------------|
| include    | Include page into sitemap (true or false)             |
| lastmod    | Include last modified date into sitemap (true or false) |
| changefreq | Set the change frequency (refer to sitemap format docs) |
| priority   | Set the page priority (refer to sitemap format docs)  |