import { v4 as uuid } from "uuid";
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
        const db = this.fastify.mongoClient.db(
            this.fastify.systemConfig.mongo.dbName,
        );
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
        const adminUser = await db
            .collection(this.fastify.systemConfig.collections.users)
            .findOne({
                username: "admin",
            });
        if (!this.installedVersion && !adminUser) {
            const password = await this.auth.createHash(
                `password${this.fastify.systemConfig.secret}`,
            );
            const resultUser = await db
                .collection(this.fastify.systemConfig.collections.users)
                .updateOne(
                    {
                        username: "admin",
                    },
                    {
                        $set: {
                            username: "admin",
                            password,
                            groups: ["admin"],
                            active: true,
                        },
                    },
                    {
                        upsert: true,
                    },
                );
            const resultGroup = await db
                .collection(this.fastify.systemConfig.collections.groups)
                .updateOne(
                    {
                        group: "admin",
                    },
                    {
                        $set: {
                            group: "admin",
                            data: [
                                {
                                    uid: uuid(),
                                    id: "admin",
                                    type: "boolean",
                                    value: true,
                                },
                            ],
                        },
                    },
                    {
                        upsert: true,
                    },
                );
            if (
                resultUser &&
                resultUser.acknowledged &&
                resultGroup &&
                resultGroup.acknowledged
            ) {
                this.fastify.log.info(
                    "User 'admin' has been created/updated in the database",
                );
            } else {
                this.fastify.log.error(
                    "Could not create/update 'admin' user in the database",
                );
            }
        }
    }
}
