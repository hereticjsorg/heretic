import { ObjectId } from "mongodb";
import moduleConfig from "../module.js";
import utils from "../api/utils";

export default class {
    constructor(fastify) {
        this.fastify = fastify;
    }

    // eslint-disable-next-line no-unused-vars
    onConnect(connection, req) {}

    async lock(connection, id, user) {
        await this.fastify.redis.set(
            `${this.fastify.systemConfig.id}_lock_${moduleConfig.id}_${id}`,
            user,
            "ex",
            moduleConfig.options.lockTimeout,
        );
        connection.lockId = id;
    }

    async unlock(connection, id) {
        await this.fastify.redis.del(
            `${this.fastify.systemConfig.id}_lock_${moduleConfig.id}_${id || connection.lockId}`,
        );
    }

    async onMessage(connection, req, message) {
        const authData = await req.auth.getData(req.auth.methods.COOKIE);
        if (!authData) {
            return;
        }
        try {
            const data = JSON.parse(String(message));
            if (
                !data ||
                data.module !== moduleConfig.id ||
                !data.id ||
                !this.fastify.redis
            ) {
                return;
            }
            this.data = data;
            switch (data.action) {
                case "lock":
                    const item = await this.fastify.mongo.db
                        .collection(moduleConfig.collections.main)
                        .findOne({
                            _id: new ObjectId(data.id),
                        });
                    if (!item || !utils.isSaveAllowed(authData, item)) {
                        return;
                    }
                    await this.lock(
                        connection,
                        data.id,
                        authData._id.toString(),
                    );
                    this.fastify.webSocketBroadcast({
                        module: moduleConfig.id,
                        action: "locked",
                        id: data.id,
                        username: authData.username,
                    });
                    break;
                case "unlock":
                    const userId = await this.fastify.redis.get(
                        `${this.fastify.systemConfig.id}_lock_${moduleConfig.id}_${connection.lockId}`,
                    );
                    if (userId === authData._id.toString()) {
                        await this.unlock(connection, data.id);
                        this.fastify.webSocketBroadcast({
                            module: moduleConfig.id,
                            action: "unlocked",
                            id: data.id,
                        });
                        connection.lockId = null;
                    }
                    break;
            }
        } catch {
            // Ignore
        }
    }

    // eslint-disable-next-line no-unused-vars
    async onDisconnect(connection, req) {
        try {
            if (connection.lockId) {
                await this.unlock(connection);
                this.fastify.webSocketBroadcast({
                    module: moduleConfig.id,
                    action: "unlocked",
                    id: connection.lockId,
                });
                connection.lockId = null;
            }
        } catch {
            // Ignore
        }
    }
}
