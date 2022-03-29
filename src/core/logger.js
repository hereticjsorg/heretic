import fs from "fs-extra";
import path from "path";
import pino from "pino";
import serverData from "../build/server.json";

const config = fs.readJsonSync(path.resolve("__dirname", "..", "etc", "system.json"));

export default pino({
    level: config.log.level,
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
    prettyPrint: !serverData.production && config.log.pretty ? {
        ...config.log.pretty,
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
