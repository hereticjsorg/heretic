# Internationalization

Heretic has a full support for multi-language sites out of the box.

## Configuration files

First thing first, you well need to edit the file containing a list of languages available (*./src/config/languages.json*):

```json
{
    "en-us": "English",
    "ru-ru": "Русский"
}
```

To include a new language into your website, simply add a new key and value, example:

```json
{
    "en-us": "English",
    "ru-ru": "Русский",
    "de-de": "Deutsch"
}
```

The first language in this list is a default one (used when no language is selected).

After you've defined all the languages you need, it's time to change the main meta.json (*./etc/meta.json*) and update it according to your language list:

```json
{

    ...

	"title": {
		"en-us": "Heretic Test Website",
		"ru-ru": "Тестовый сайт на Heretic"
	},
	"shortTitle": {
		"en-us": "Heretic",
		"ru-ru": "Тест"
	},
	"description": {
		"ru-ru": "Тестовый сайт, созданный на Heretic",
		"en-us": "Test site built on Heretic"
	}
}
```

You will need to set *title*, *shortTitle* and *description* to set website title, a shorter version of title and general description, correspondingly. These values are used to display in the browser window title and to generate sitemap for you.

Each page has its own *meta.json* file where you must define *title* and *description* of each page according to your language list.

## Localized Page Versions

Each page may have its localized version (that's optional, but you can use this feature in case when content for different languages is absolutely different).

To use this feature, you will need to set the *langSwitchComponent* parameter to *true* in page's *meta.json* file. If true, Heretic will generate &lt;lang-switch/&gt; component for each page to display a different content version for each page.

Each page has the following structure:

* the main *index.marko* file only has &lt;content/&gt; tag inside
* the *index.marko* of *contents* component refers to the the *&lt;lang-switch/&gt;* component of the current page
* the *index.marko* of *lang-switch* component (auto-generated during build process) chooses which component to display, based on current language
* the *index.marko* of *lang-xx-xx* component displays actual content for a corresponding language

Take a look on a page template located in *./src/pages/.blank* as a reference.

**Note**: you should not edit *&lt;lang-switch/&gt;* manually because it gets overwritten each time you start the build process.

If you don't need a separate content for different languages, you may wish to simply set *langSwitchComponent* parameter to *false*.