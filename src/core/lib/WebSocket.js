export default class {
    async process(connection, req) {
        const authData = await req.auth.getData(req.auth.methods.COOKIE);
        for (const handler of this.wsHandlers) {
            if (!authData) {
                try {
                    connection.socket.send(JSON.stringify({
                        error: true,
                        code: 403,
                        message: "accessDenied",
                    }));
                } catch {
                    // Ignore
                }
                try {
                    connection.socket.close();
                } catch {
                    // Ignore
                }
                return;
            }
            handler.onConnect(connection, req);
        }
        if (this.redis) {
            await this.redis.incr(`${this.fastify.siteConfig.id}_user_${authData._id.toString()}`);
        }
        connection.socket.on("message", message => {
            for (const handler of this.wsHandlers) {
                handler.onMessage(connection, req, message);
            }
        });
        connection.socket.on("close", () => {
            for (const handler of this.wsHandlers) {
                handler.onDisconnect(connection, req);
            }
        });
    }
}
