# Introduction

Sometimes we just need a good old website, without any extras like database connection, admin panel etc.. There are several ways to build a website which serves static HTML files, and this approach has many disadvantages: each page is being loaded individually, but we definitely don't want to go back to the 2000s. Another disadvantage of modern web sites is that nobody thinks about users who are still using "old-school" 3G or even 2G networks and don't want to wait minutes for a simple page to load.

SPA (single page application) is a good solution which doesn't require to reload each page when its content needs an update. But the problem is that those websites are being completely rendered on client side, so not every search engine will be able to crawl them. A good solution is to render the page on the server side (server-side rendering) and "activate" the SPA mode afterwards (re-hydrate). When an user wants to get to another page, a small chunk of data will be loaded from server, and there is no need to reload a page completely.

Putting all together, the idea is to create a boilerplate so everyone (having a basic knowledge of HTML and CSS) will be able to build a website which is going to be fast, using SSR approach and easy to fill with with unlimited number of pages. This is where the Heretic comes into play.

## Features

Heretic is perfect use when you don't need any of advanced [ZOIA](https://github.com/xtremespb/zoia) features like database support, authentication etc.

* Heretic is based on [Marko.js](https://markojs.com), a language for building dynamic and reactive user interfaces; it's like HTML and JS had a perfect baby that grew up to be awesome
* Using [Bulma](https://bulma.io/), a free, open source modular framework that provides ready-to-use frontend components that you can easily combine to build responsive web interfaces
* Using Webpack 5 to build an optimized, GZipped chunks and load every part of the site on demand
* Built-in client-side and server-side routing and internationalization support
* Combining server-side rendering (SSR) and single-page applications (SPA) = isomorphic
* Using Fastify for higher performance
* Select the required components only to reduce the amount of data served

## Why Heretic?

In the modern world, there are several standards, such as React and Vue , which have a number of disadvantages. The difficulty of implementing quick and simple projects using the SSR approach from scratch, as well as the need to learn special syntax such as JSX, has led to the emergence of new frameworks based on frameworks.

The syntax used by Marko does not differ at all from HTML, but, if desired, gives a lot of possibilities in order to create technically complex projects. Thus, in order to use Marko, a basic knowledge of HTML layout is sufficient.

Based on this, the name used by the project appeared. Heretic is a person holding an opinion at odds with what is generally accepted. So why not to give it a try?