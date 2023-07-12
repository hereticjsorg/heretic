# API Modules

In order to extend your website functionality and be able to interact with server-side functions, you may use the *API Modules* functionality.

The only mandatory file is *index.js* which shall be used to specify API routes. According to the Heretic style guide, each API route URL shall start with */api*.

Example (*./site/auth/api/index.js*):

```javascript
import apiSomething from "./apiSomething";

export default fastify => {
    fastify.post("/api/something", apiSomething());
};
```

Each route must be separated to a different file which will export a fastify handler function:

```javascript
export default () => ({
    async handler(req, rep) {
        return rep.code(200).send({});
    }
});
```

Each file may have [Validation and Serialization](https://www.fastify.io/docs/latest/Reference/Validation-and-Serialization/) settings, rate limit settings etc.

To define specific [rate limit](rateLimit.md) settings, you will need to use the following syntax:

```javascript
export default () => ({
    rateLimit: {
        max: 10,
        ban: 50,
        timeWindow: 10000
    },
    async handler(req, rep) {
        return rep.code(200).send({});
    }
});
```