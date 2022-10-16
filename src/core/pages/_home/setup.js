import indexes from "./indexes.json";

export default class {
    constructor(id, config, db, func) {
        this.config = config;
        this.db = db;
        this.id = id;
        this.func = func;
    }

    async process() {
        for (const c of Object.keys(indexes)) {
            const indexData = indexes[c];
            const collection = this.config.system.collections[c];
            for (const direction of ["asc", "desc"]) {
                if (!indexData[direction]) {
                    continue;
                }
                await this.func.createIndex(this.db, this.id, collection, indexData[direction], direction);
            }
            if (indexData.expire) {
                await this.func.createExpireIndex(this.db, this.id, collection, indexData.expire.field, indexData.expire.seconds);
            }
        }
    }
}
