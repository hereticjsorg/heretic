# Pages

In order to create a page, you will need to create a sub-directory under the *./src/pages* directory. You may wish either to start from scratch or to use a template.

## Using Page Template

You will need to copy the *./src/core/defaults/.blank* directory to the *./src/pages* directory. Then:

* Rename the *./src/pages/.blank* directory to match its contents (e.g. "test", *./src/pages/test*)
* Set page configuration in a *./src/pages/test/page.js* (it's mandatory to set the unique page ID and route path)
* Put the required contents to the *./src/pages/test/content/lang-xx-xx* directories (matching your languages)
* When necessary, add your page ID to the *./src/config/navigation.json* file (see [configuration files](./configurationFiles.md) for more info)

## Page Configuration

Each page is being configured using *page.js* file which located in page directory.

| Option | Description |
|--------|-------------|
| id | Unique ID of a page, used for routes and navigation |
| path | Route path (use "" for root route, or start with "/" otherwise, e.g. "/example") |
| langSwitchComponent | Create &lt;lang-switch/&gt; component during build (see internationalization docs),<br>either true of false |

To change locale-specific options, you will need to edit the *meta.json* file:

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

## Meta Pages

You can combine multiple pages in a single directory in order to follow the internal logic of your project. To do this, create a directory where you will put all of your page directories and create *website.json* file with the following contents:

```json
["directory1", "directory2", "etc"]
```

Each entry should correspond an internal page directory.

Remember that each page (even when it's located inside of such container) should contain unique IDs.