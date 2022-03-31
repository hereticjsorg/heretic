# Pages

In order to create a page, you will need to create a sub-directory under the *./src/pages* directory. You may wish either to start from scratch or to use a template.

## Using Page Template

You will need to copy the *./src/defaults/blank* directory to the *./src/pages* directory. Then:

* Rename the *./src/pages/blank* directory to match its contents (e.g. "test", *./src/pages/test*)
* Set page configuration in a *./src/pages/test/meta.json* (it's mandatory to set the unique page ID and route path)
* Put the required contents to the *./src/pages/test/content/lang-xx-xx* directories (matching your languages)
* When necessary, add your page ID to the *./src/config/navigation.json* file (see [configuration files](./configurationFiles.md) for more info)

## Page Configuration

Each page is being configured using *meta.json* file which located in page's directory.
