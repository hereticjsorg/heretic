const packageJson = require("../../../package.json");

export default class {
    constructor(id, fastify, func) {
        this.fastify = fastify;
        this.id = id;
        this.func = func;
    }

    async process() {
        if (!this.fastify.systemConfig.mongo.enabled) {
            return;
        }
        const db = this.fastify.mongoClient.db(this.fastify.systemConfig.mongo.dbName);
        try {
            await db.createCollection(this.fastify.systemConfig.collections.counters);
        } catch {
            // Ignore
        }
        try {
            try {
                await db.createCollection(this.fastify.systemConfig.collections.system);
            } catch {
                // Ignore
            }
            await db.collection(this.fastify.systemConfig.collections.system).findOneAndUpdate({
                _id: "version",
            }, {
                $set: {
                    value: packageJson.version,
                },
            }, {
                upsert: true,
            });
        } catch (e) {
            this.fastify.log.error(e.message);
            // Ignore
        }
    }
}
