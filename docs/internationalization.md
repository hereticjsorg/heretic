# Internationalization

Heretic has a full support for multi-language sites out of the box.

## Configuration files

First thing first, you well need to edit the file containing a list of languages available (*./etc/languages.json*):

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

Each page of a module has *meta.src.json* file where you must define *title* and *description* of each page according to your language list.

## Localized Pages Versions

Each page may have its localized version (that's optional, but you can use this feature in case when content for different languages is absolutely different).

To use this feature, you will need to set the *langSwitchComponent* parameter to *true* in page's *page.js* file. If true, Heretic will generate &lt;lang-switch/&gt; component for each page to display a different content version for each page.

Each page has the following structure:

* the main *index.marko* file only has &lt;content/&gt; tag inside
* the *index.marko* of *contents* component refers to the the *&lt;lang-switch/&gt;* component of the current page
* the *index.marko* of *lang-switch* component (auto-generated during build process) chooses which component to display, based on current language
* the *index.marko* of *lang-xx-xx* component displays actual content for a corresponding language

Take a look on a page template located in *./src/core/defaults/blank* as a reference.

**Note**: you should **NOT** edit *&lt;lang-switch/&gt;* manually because it gets overwritten each time you start the build process.

If you don't need a separate content for different languages, you may wish to simply set *langSwitchComponent* parameter to *false*.

# System-Wide Translation

You may use the *&lt;t/&gt;* component to translate strings. There are two kind of translation dictionaries: *core* and *user* (located in *./src/translations* directory). You may change the *user* dictionaries as the don't get overwritten during the update process.

To translate strings this way, you will need:

1. Add a new key-value pair to each language, dictionary, e.g. *./site/translations/en-us.json*, *./site/translations/ru-ru.json* etc.
2. Add a *&lt;t/&gt;* and set your key as tag body

Translation dictionary (e.g. *en-us.json*) is a simple JSON file and looks like this:

```json
{
    "404": "Not Found",
    "desc404": "The link is broken or the page has been moved.",
    "internalServerErrorTitle": "Internal Server Error",
    "internalServerErrorMessage": "There is an error on the server side. Please try to refresh this page.",
    "somethingWentWrong": "Something went wrong :-(",
    "poweredByHeretic": "Powered by Heretic",
    "mMatveev": "Mikhail A. Matveev",
    "mitLicense": "Licensed under MIT License."
}
```

In order to translate a string (*mitLicense* for example), you may use the following syntax:

```html
<t>mitLicense</t>
```

When rendering, it will replaced to *Licensed under MIT License* for *en-us* language.

## Template Support

Under the hood, every string from the translation dictionaries (JSON files) is being considered as a template and is being processed by [Lodash Template Engine](https://lodash.com/docs/4.17.15#template). This allows you to use all the features of the template engine, e.g. variables.

Example:

```json
{
    "greeting": "Hello ${user}!"
}
```

```html
<t data={user: "Medved"}>greeting</t>
```

Result:

```html
Hello Medved!
```

## Pluralization

Heretic i18n engine hash pluralization support out-of-the-box. It uses [Intl.PluralRules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules) under the hood in order to display different strings for different pluralization rules.

Example:

```json
{
    "online": "${count} users online",
    "online_one": "${count} user online"
}
```

```html
<div>
    <t data={count: 1} plural=1>online</t>
</div>
<div>
    <t data={count: 2} plural=2>online</t>
</div>
```

Result:

```html
1 user online
2 users online
```