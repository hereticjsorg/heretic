# ZSPA (ZOIA Single Page Application)

ZSPA is an engine which allows you to build a blazing fast and modern static website which doesn't require any server part to run. It's perfect to build static websites which won't require any server interaction such as admin panel, authentication etc.

It's a perfect use when you don't need any of advanced [ZOIA](https://github.com/xtremespb/zoia) features like database support, authentication, server-side rendering etc.

You may also wish to use ZSPA as a *boilerplate* to build a SPA based on Marko because it contains all the necessary build configuration and dependencies.

## Features

* Based on [Marko.js](https://markojs.com), a language for building dynamic and reactive user interfaces
* Using [Bulma](https://bulma.io/), a free, open source framework that provides ready-to-use frontend components that you can easily combine to build responsive web interfaces
* Using Webpack 5 to build an optimized, GZipped chunks and load every part of the site on demand
* Built-in Routing and internationalization support

## Demo

Check out the demo website at [zspa.zoiajs.org](https://zspa.zoiajs.org). It's currently not a part of CI/CD process so is not regularly updated.

## Usage

First, you need to clone the ZSPA from Github repository:

```
git clone https://github.com/xtremespb/zspa.git
```

Then, you will need to install the required NPM modules and start the build process:

```
npm i
npm run build-production
```

When successful, a demo website will be generated in the *./dist* directory.

## Configuration files

To build your own website, you will need to change the configuration files according to your needs. All the required configuration files are located in the *./etc* directory.

### routes.json

Define your routes here. [Router5](https://router5.js.org/) is used in the background, so you will need to use the corresponding syntax. Each route has the following structure:

```
{
    "name": "home",
    "path": ":language<([a-z]{2}-[a-z]{2})?>/",
    "defaultParams": {
        "language": ""
    }
}
```

The *:language* part is important in order for internationalization to work as it provides the current locale as part of an URL.

### navigation.json

Define a list of routes which will be displayed at the top of the page as part of *navbar* component.

```
{
    "defaultRoute": "home",
    "routes": ["home", "license"]
}
```

* **"routes"** parameter is an array of strings, each string represents a route ID which has been previously defined in *routes.json* configuration file.
* **"defaultRoute"** defines a default route ID.

### languages.json

This file is a starting point to define your website internationalization settings because it contains a list of available languages:

```
{
    "en-us": "English",
    "ru-ru": "Русский"
}
```

Each language ID shall contain 5 characters and shall look like "xx-xx".

The first language in this list is the *default* language.

### translations/xx-xx.json

Translation file for each language should be placed to the *./translations* directory. It's a key-value JSON format which is easy to read and modify:

```
{
    "title": "ZSPA",
    "home": "Home Page",
    "license": "License"
}
```

Every language defined in *languages.json* shall be represented in this directory.

### translations/core/xx-xx.json

Same as above, every template-specific (core) translations shall be placed there. Every language defined in *languages.json* shall also be represented in this directory.

### i18n-loader.js

This JavaScript file exports an async function called *loadLanguageFile* which is used to load the corresponding translation file. The switch operator is being used to choose between languages and import the required ones on demand.

In order to generate the chunks, Webpack is using the following syntax (used in this script) to generate the correct chunk names:

```Javascript
translationCore = await import(/* webpackChunkName: "lang-core-en-us" */ `./translations/core/en-us.json`);
translationUser = await import(/* webpackChunkName: "lang-en-us" */ `./translations/en-us.json`);
```

If you need to add a new translation language or to remove a not used one, you will need to modify this file accordingly.

### pages-loader.js

Same as *i18n-loader.js*, this file is intended to generate proper Webpack chunks. This loader exports an async function called *loadComponent* which chooses a proper Marko component based on a route name:

```Javascript
switch (route) {
    case "home":
        return import(/* webpackChunkName: "page.home" */ "../src/zoia/pages/home");
    case "license":
            return import(/* webpackChunkName: "page.license" */ "../src/zoia/pages/license");
    default:
            return import(/* webpackChunkName: "page.404" */ "../src/zoia/errors/404");
}
```

If a route is unknown, the "Not Found" (error/404) component is loaded.

## Configuring Bulma components

In order to reduce the size of CSS bundles, you may wish to configure the Bulma components which are really used in your project.

To do this, you will need to edit the *./etc/bulma.scs* and uncomment the imports you will need. By default, all modules available in Bulma are imported.

## Creating Pages

The pages are just ordinary Marko components which shall be placed to the *./src/zoia/pages* directory. The directory of each page may contain the following files:

* **index.marko**: a Marko template which contains the contents to be displayed when this route is loaded.
* **marko.json**: a configuration file which defines the options, e.g. where to find the custom tags.
* **component.js**: a JavaScript file which defines the page logic
* **style.scss** (optional): a SCSS file which describes specific styles for the corresponding page.

A minimal *index.marko* file may look like this:

```HTML
$ const { t } = out.global.i18n;
<div>
    <h1 class="title">${t("home")}</h1>
    <p>This is the home page!</p>
</div> 
```

You may import the required methods or properties from the *i18n* library using the global scope and use them in your Marko file as shown above.

The *i18n* library exports the following:

* **t(id)**: translate a variable using the locale files
* **setLanguage(language)**: set a new language ID
* **getLanguage()**: get an active language ID
* **loadDefaultLanguage()**: load default language
* **languages**: returns the contents of *languages.json* configuration file
* **defaultLanguage**: ID of the default language

A minimal *component.js* file may look like this:

```Javascript
/* eslint-disable import/no-unresolved */
module.exports = class {
    onCreate(input, out) {
        const state = {
            language: out.global.i18n.getLanguage(),
        };
        this.state = state;
        this.i18n = out.global.i18n;
        this.parentComponent = input.parentComponent;
    }

    async updateLanguage(language) {
        if (language !== this.state.language) {
            setTimeout(() => {
                this.setState("language", language);
            });
        }
    }
};
```

The *updateLanguage* method is called when the user selects another locale in order do perform the necessary render actions to a page component.

If you need to apply the internationalization to the parts of your page, you will probably need to chunk every localized part. To do this, you will need the following changes in your *component.js* file.

First, create a new state for a "localized" component:

```Javascript
const state = {
    language: out.global.i18n.getLanguage(),
    currentComponent: null,
};
```

Then, add a new async method to load your components as chunks:

```Javascript
async loadComponent(language = this.i18n.getLanguage()) {
    let component = null;
    const timer = this.parentComponent.getAnimationTimer();
    try {
        switch (language) {
        case "ru-ru":
            component = await import(/* webpackChunkName: "page.home.ru-ru" */ "./home-ru-ru");
            break;
        default:
            component = await import(/* webpackChunkName: "page.home.en-us" */ "./home-en-us");
        }
        this.parentComponent.clearAnimationTimer(timer);
    } catch {
        this.parentComponent.clearAnimationTimer(timer);
        this.parentComponent.setState("500", true);
    }
    this.setState("currentComponent", component);
}
```

You will need to load those components when the page component is mounted:

```Javascript
onMount() {
    this.loadComponent();
}
```

And you will need to call the *loadComponent* method each time a user selects a different locale:

```Javascript
async updateLanguage(language) {
    if (language !== this.state.language) {
        setTimeout(() => {
            this.setState("language", language);
        });
    }
    this.loadComponent(language);
}
```

Then, you need to modify *index.marko* in order to include the chunk:

```HTML
$ const { t } = out.global.i18n;
<div>
    <h1 class="title">${t("home")}</h1>
    <${state.currentComponent}/>
</div>
```

Finally, you need to create the "localized" components:

```
home-en-us
- index.marko
home-ru-ru
- index.marko
```

And modify the *home-xx-xx/index.marko* accordingly.