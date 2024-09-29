import Auth from "#lib/auth";
import indexes from "./indexes.json";

export default class {
    constructor(id, fastify, func, installedVersions) {
        this.fastify = fastify;
        this.id = id;
        this.func = func;
        this.installedVersion = installedVersions[id];
        this.auth = new Auth(this.fastify);
    }

    async process() {
        if (!this.fastify.systemConfig.mongo.enabled) {
            return;
        }
        for (const c of Object.keys(indexes)) {
            const indexData = indexes[c];
            const collection = this.fastify.systemConfig.collections[c];
            for (const direction of ["asc", "desc"]) {
                if (!indexData[direction]) {
                    continue;
                }
                await this.func.createIndex(
                    this.id,
                    collection,
                    indexData[direction],
                    direction,
                );
            }
            if (indexData.expire) {
                await this.func.createExpireIndex(
                    this.id,
                    collection,
                    indexData.expire.field,
                    indexData.expire.seconds,
                );
            }
        }
    }
}
