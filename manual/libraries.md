# Libraries and Helpers

Heretic provides several built-in libraries and helpers for you.

## Fastify Globals

* Access both main configuration files (*system.js* and *website.json*) using the Fastify decorations: *fastify.systemConfig*, *fastify.siteConfig*:

```javascript
    console.log(fastify.systemConfig.server.ip);
```

* Access Redis instance (when enabled) using *fastify.redis*
* Access *languages* object using *fastify.languages* (this returns key-value paris from *./src/config/languages.json*)
* Access *navigation* data using *fastify.navigation* (this returns *./src/config/navigation.json*)