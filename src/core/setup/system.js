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
                await db.createCollection(this.fastify.systemConfig.collections.version);
            } catch {
                // Ignore
            }
        } catch (e) {
            this.fastify.log.error(e.message);
            // Ignore
        }
    }
}
