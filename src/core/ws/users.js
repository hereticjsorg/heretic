export default class {
    constructor(fastify) {
        this.fastify = fastify;
    }

    // eslint-disable-next-line no-unused-vars
    onConnect(connection, req) {}

    async onMessage(connection, req, message) {
        const authData = await req.auth.getData(req.auth.methods.COOKIE);
        if (!authData || !connection.uid) {
            return;
        }
        try {
            const data = JSON.parse(String(message));
            if (!data || data.module !== "core" || !this.fastify.redis) {
                return;
            }
            this.data = data;
            switch (data.action) {
            case "ping":
                await this.fastify.redis.set(`${this.fastify.siteConfig.id}_user_${authData._id.toString()}_${connection.uid.replace(/-/gm, "_")}`, Math.floor(Date.now() / 1000), "ex", 120);
                break;
            }
        } catch {
            // Ignore
        }
    }

    // eslint-disable-next-line no-unused-vars
    onDisconnect(connection, req) {}
}
