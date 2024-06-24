const fp = require("fastify-plugin");
const {
    MongoClient,
    ObjectId,
} = require("mongodb");

function decorateFastifyInstance(fastify, client, options) {
    const {
        forceClose,
        database,
        name,
        newClient
    } = options;
    if (newClient) {
        fastify.addHook("onClose", () => client.close(forceClose));
    }
    const mongo = {
        client,
        ObjectId
    };
    if (name) {
        if (!fastify.mongo) {
            fastify.decorate("mongo", mongo);
        }
        if (fastify.mongo[name]) {
            throw Error(`Connection name already registered: ${ name}`);
        }

        fastify.mongo[name] = mongo;
    } else if (fastify.mongo) {
        throw Error("fastify-mongodb has already registered");
    }
    if (database) {
        mongo.db = client.db(database);
    }
    if (!fastify.mongo) {
        fastify.decorate("mongo", mongo);
    }
}

// eslint-disable-next-line no-unused-vars
async function fastifyMongo(fastify, options) {
    options = {
        serverSelectionTimeoutMS: 7500,
        ...options
    };
    const {
        forceClose,
        name,
        database,
        url,
        client,
        ...opts
    } = options;
    if (client) {
        decorateFastifyInstance(fastify, client, {
            newClient: false,
            forceClose,
            database,
            name,
        });
    } else {
        if (!url) {
            throw Error("`url` parameter is mandatory if no client is provided");
        }
        const urlTokens = /\w\/([^?]*)/g.exec(url);
        const parsedDbName = urlTokens && urlTokens[1];
        const databaseName = database || parsedDbName;
        const mongoClient = new MongoClient(url, opts);
        await mongoClient.connect();
        decorateFastifyInstance(fastify, client, {
            newClient: true,
            forceClose,
            database: databaseName,
            name,
        });
    }
}

module.exports = fp(fastifyMongo, {
    fastify: "4.x",
    name: "hereticMongo",
});

module.exports.default = fastifyMongo;
module.exports.fastifyMongo = fastifyMongo;

module.exports.mongodb = require("mongodb");

module.exports.ObjectId = ObjectId;
