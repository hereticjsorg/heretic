# Libraries and Helpers

Heretic provides several built-in libraries and helpers for you.

## Fastify Globals

* Access both main configuration files (*system.js* and *website.js*) using the Fastify decorations: *fastify.systemConfig*, *fastify.siteConfig*:

```javascript
    console.log(fastify.systemConfig.server.ip);
```

* Access Redis instance (when enabled) using *fastify.redis*
* Access MongoDB instance (when enabled) using *fastify.mongo*
* Access *languages* object using *fastify.languages* (this returns key-value pairs from *./site/etc/languages.json*)
* Access *navigation* data using *fastify.navigation* (this returns *./site/etc/navigation.json*)