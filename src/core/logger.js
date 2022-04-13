import pino from "pino";
import serverData from "../build/server.json";

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
            prettyPrint: !serverData.production && this.config.log.pretty ? {
                ...this.config.log.pretty,
                messageFormat: (log, messageKey) => {
                    let message = "";
                    if (log[messageKey]) {
                        log[messageKey] = log[messageKey].replace(/^request completed$/, "REQ").replace(/^incoming request$/, "REP");
                        message += `${log[messageKey]} `;
                    }
                    if (log.reqId) {
                        message += `(${log.reqId}) `;
                    }
                    if (log.res && log.res.statusCode) {
                        message += `[${log.res.statusCode}] `;
                    }
                    if (log.req && log.req.remoteAddress) {
                        message += `[${log.req.remoteAddress}] `;
                    }
                    if (log.req && log.req.method) {
                        message += `${log.req.method} `;
                    }
                    if (log.req && log.req.url) {
                        message += `${log.req.url} `;
                    }
                    return message.trim();
                },
            } : false,
        });
    }
}
