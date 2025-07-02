// Based on: https://github.com/pbojinov/request-ip
// The MIT License (MIT), copyright (c) 2022 Petar Bojinov - petarbojinov+github@gmail.com

module.exports = class {
    constructor() {
        this._regexes = {
            ipv4: /^(?:(?:\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.){3}(?:\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])$/,
            ipv6: /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i,
        };
    }

    isIP(value) {
        return (
            (value &&
                typeof value === "string" &&
                this._regexes.ipv4.test(value)) ||
            this._regexes.ipv6.test(value)
        );
    }

    getIPVersion(ip) {
        if (!this.isIP(ip)) {
            return null;
        }
        return this._regexes.ipv4.test(ip) ? 4 : 6;
    }

    _getClientIpFromXForwardedFor(value) {
        if (!value || typeof value !== "string") {
            return null;
        }
        const forwardedIps = value.split(",").map((e) => {
            const ip = e.trim();
            if (ip.includes(":")) {
                const splitted = ip.split(":");
                if (splitted.length === 2) {
                    return splitted[0];
                }
            }
            return ip;
        });
        for (let i = 0; i < forwardedIps.length; i += 1) {
            if (this.isIP(forwardedIps[i])) {
                return forwardedIps[i];
            }
        }
        return null;
    }

    getClientIp(req) {
        if (req.headers) {
            if (this.isIP(req.headers["cf-connecting-ip"])) {
                return req.headers["cf-connecting-ip"];
            }
            if (this.isIP(req.headers["fastly-client-ip"])) {
                return req.headers["fastly-client-ip"];
            }
            if (this.isIP(req.headers["true-client-ip"])) {
                return req.headers["true-client-ip"];
            }
            if (this.isIP(req.headers["x-real-ip"])) {
                return req.headers["x-real-ip"];
            }
            if (this.isIP(req.headers["x-cluster-client-ip"])) {
                return req.headers["x-cluster-client-ip"];
            }
            if (this.isIP(req.headers["x-appengine-user-ip"])) {
                return req.headers["x-appengine-user-ip"];
            }
            const xForwardedFor = this._getClientIpFromXForwardedFor(
                req.headers["x-forwarded-for"],
            );
            if (this.isIP(xForwardedFor)) {
                return xForwardedFor;
            }
            if (this.isIP(req.headers["x-client-ip"])) {
                return req.headers["x-client-ip"];
            }
            if (this.isIP(req.headers["x-forwarded"])) {
                return req.headers["x-forwarded"];
            }
            if (this.isIP(req.headers["forwarded-for"])) {
                return req.headers["forwarded-for"];
            }
            if (this.isIP(req.headers.forwarded)) {
                return req.headers.forwarded;
            }
        }
        if (req.socket && this.isIP(req.socket.remoteAddress)) {
            return req.socket.remoteAddress;
        }
        if (req.info && this.isIP(req.info.remoteAddress)) {
            return req.info.remoteAddress;
        }
        if (
            req.requestContext &&
            req.requestContext.identity &&
            this.isIP(req.requestContext.identity.sourceIp)
        ) {
            return req.requestContext.identity.sourceIp;
        }
        if (req.headers) {
            if (this.isIP(req.headers["Cf-Pseudo-IPv4"])) {
                return req.headers["Cf-Pseudo-IPv4"];
            }
        }
        if (req.raw) {
            return this.getClientIp(req.raw);
        }
        return null;
    }
};
