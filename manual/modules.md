# Modules

In order to create a module, you will need to create a sub-directory under the *./src/module* directory. You may wish either to start from scratch or to use a template.

## Using Module Template

You will need to copy the *./src/core/defaults/blank* directory to the *./src/module* directory. Then:

* Rename the *./src/module/blank* directory to match its contents (e.g. "test", *./src/module/test*)
* Set module configuration in a *./src/module/test/module.json* (it's mandatory to set the unique module ID and route path)
* Put the required contents to the *./src/module/test/content/lang-xx-xx* directories (matching your languages)
* When necessary, add your module ID to the *./src/config/navigation.json* file (see [configuration files](./configurationFiles.md) for more info)

## Module Configuration

Each module is being configured using *module.json* file which located in module's directory.

| Option              | Description                                                                                           |
|---------------------|-------------------------------------------------------------------------------------------------------|
| id                  | Unique ID of a module, used for routes and navigation                                                   |
| path                | Route path (use "" for root route, or start with "/" otherwise, e.g. "/example")                      |
| langSwitchComponent | Create &lt;lang-switch/&gt; component during build (see internationalization docs),<br>either true of false |
| title               | Object containing module title for each language                                                        |
| description         | Object containing module description for each language                                                  |

Additionally, you may wish to tell Heretic build script to include a module into *sitemap.xml* file which is built automatically. To change sitemap options for each module, you will need to edit the *sitemap.json* file:

| Option     | Description                                             |
|------------|---------------------------------------------------------|
| include    | Include module into sitemap (true or false)             |
| lastmod    | Include last modified date into sitemap (true or false) |
| changefreq | Set the change frequency (refer to sitemap format docs) |
| priority   | Set the module priority (refer to sitemap format docs)  |

## Meta Modules

You can combine multiple modules in a single directory in order to follow the internal logic of your project. To do this, create a directory where you will put all of your module directories and create *meta.json* file with the following contents:

```json
["directory1", "directory2", "etc"]
```

Each entry should correspond an internal module directory.

Remember that each module (even when it's located inside of such container) should contain unique IDs.