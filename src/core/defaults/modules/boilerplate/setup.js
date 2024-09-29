import FormData from "./data/form.js";
import moduleConfig from "./module.js";

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
        const db = this.fastify.mongoClient.db(
            this.fastify.systemConfig.mongo.dbName,
        );
        const formData = new FormData();
        const fields = Object.keys(formData.getFieldsFlat())
            .map((i) => (formData.getFieldsFlat()[i].createIndex ? i : null))
            .filter((i) => i);
        const indexData = {
            asc: fields,
            desc: fields,
        };
        const collectionMain = moduleConfig.collections.main;
        for (const direction of ["asc", "desc"]) {
            if (!indexData[direction]) {
                continue;
            }
            await this.func.createIndex(
                this.id,
                collectionMain,
                indexData[direction],
                direction,
            );
        }
        if (indexData.expire) {
            await this.func.createExpireIndex(
                this.id,
                collectionMain,
                indexData.expire.field,
                indexData.expire.seconds,
            );
        }
        let counter = 1;
        const existingSeqDb = await db
            .collection(this.fastify.systemConfig.collections.counters)
            .findOne({
                _id: moduleConfig.id,
            });
        if (existingSeqDb) {
            counter = existingSeqDb.value;
        }
        const highestIdDb = await db
            .collection(collectionMain)
            .find(
                {},
                {
                    sort: {
                        id: -1,
                    },
                    limit: 1,
                },
            )
            .toArray();
        if (highestIdDb && highestIdDb.length) {
            const highestValue = highestIdDb[0].id;
            if (highestValue > counter) {
                counter = highestValue + 1;
            }
        }
        await db
            .collection(this.fastify.systemConfig.collections.counters)
            .findOneAndUpdate(
                {
                    _id: moduleConfig.id,
                },
                {
                    $set: {
                        seq: counter,
                    },
                },
                {
                    upsert: true,
                },
            );
    }
}
