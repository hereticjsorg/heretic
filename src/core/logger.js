import pino from "pino";

export default class {
    constructor(config) {
        this.config = config;
    }

    getPino() {
        return pino({
            level: this.config.log.level,
            serializers: {
                req(request) {
                    return {
                        method: request.method,
                        url: request.url,
                        hostname: request.hostname,
                        remoteAddress: request.ip,
                        remotePort: request.socket.remotePort,
                    };
                }
            },
        });
    }
}
