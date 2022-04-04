# Pages

In order to create a page, you will need to create a sub-directory under the *./src/pages* directory. You may wish either to start from scratch or to use a template.

## Using Page Template

You will need to copy the *./src/core/defaults/blank* directory to the *./src/pages* directory. Then:

* Rename the *./src/pages/blank* directory to match its contents (e.g. "test", *./src/pages/test*)
* Set page configuration in a *./src/pages/test/meta.json* (it's mandatory to set the unique page ID and route path)
* Put the required contents to the *./src/pages/test/content/lang-xx-xx* directories (matching your languages)
* When necessary, add your page ID to the *./src/config/navigation.json* file (see [configuration files](./configurationFiles.md) for more info)

## Page Configuration

Each page is being configured using *meta.json* file which located in page's directory.

| Option              | Description                                                                                           |
|---------------------|-------------------------------------------------------------------------------------------------------|
| id                  | Unique ID of a page, used for routes and navigation                                                   |
| path                | Route path (use "" for root route, or start with "/" otherwise, e.g. "/example")                      |
| langSwitchComponent | Create &lt;lang-switch/&gt; component during build (see internationalization docs),<br>either true of false |
| title               | Object containing page title for each language                                                        |
| description         | Object containing page description for each language                                                  |

Additionally, you may wish to tell Heretic build script to include a page into *sitemap.xml* file which is built automatically. To change sitemap options for each page, you will need to edit the *sitemap.json* file:

| Option     | Description                                             |
|------------|---------------------------------------------------------|
| include    | Include page into sitemap (true or false)               |
| lastmod    | Include last modified date into sitemap (true or false) |
| changefreq | Set the change frequency (refer to sitemap format docs) |
| priority   | Set the page priority (refer to sitemap format docs)    |