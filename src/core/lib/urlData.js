const fp = require("fastify-plugin");
const urijs = require("uri-js");

function plugin(fastify, options, next) {
    fastify.decorateRequest("urlData", (key, req) => {
        const data = req || this;
        if (!data || !data.headers) {
            return {};
        }
        const scheme = `${data.headers[":scheme"] ? `${data.headers[":scheme"]}:` : ""}//`;
        const host = data.headers[":authority"] || data.headers.host;
        const path = data.headers[":path"] || data.raw.url;
        const urlData = urijs.parse(`${scheme}${host}${path}`);
        if (key) {
            return urlData[key];
        }
        return urlData;
    });
    next();
}

module.exports = fp(plugin, {
    fastify: ">= 3.0.0",
    name: "heretic-url-data",
});
