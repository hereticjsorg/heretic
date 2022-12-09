// Based on: https://github.com/pbojinov/request-ip
// The MIT License (MIT), copyright (c) 2022 Petar Bojinov - petarbojinov+github@gmail.com

export default class {
    constructor() {
        this._regexes = {
            ipv4: /^(?:(?:\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.){3}(?:\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])$/,
            ipv6: /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i,
        };
    }

    _isIP(value) {
        return (
            (value && typeof value === "string" && this._regexes.ipv4.test(value)) || this._regexes.ipv6.test(value)
        );
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
            if (this._isIP(forwardedIps[i])) {
                return forwardedIps[i];
            }
        }
        return null;
    }

    getClientIp(req) {
        if (req.headers) {
            if (this._isIP(req.headers["x-client-ip"])) {
                return req.headers["x-client-ip"];
            }
            const xForwardedFor = this._getClientIpFromXForwardedFor(
                req.headers["x-forwarded-for"],
            );
            if (this._isIP(xForwardedFor)) {
                return xForwardedFor;
            }
            if (this._isIP(req.headers["cf-connecting-ip"])) {
                return req.headers["cf-connecting-ip"];
            }
            if (this._isIP(req.headers["fastly-client-ip"])) {
                return req.headers["fastly-client-ip"];
            }
            if (this._isIP(req.headers["true-client-ip"])) {
                return req.headers["true-client-ip"];
            }
            if (this._isIP(req.headers["x-real-ip"])) {
                return req.headers["x-real-ip"];
            }
            if (this._isIP(req.headers["x-cluster-client-ip"])) {
                return req.headers["x-cluster-client-ip"];
            }
            if (this._isIP(req.headers["x-forwarded"])) {
                return req.headers["x-forwarded"];
            }
            if (this._isIP(req.headers["forwarded-for"])) {
                return req.headers["forwarded-for"];
            }
            if (this._isIP(req.headers.forwarded)) {
                return req.headers.forwarded;
            }
            if (this._isIP(req.headers["x-appengine-user-ip"])) {
                return req.headers["x-appengine-user-ip"];
            }
        }
        if (req.socket && this._isIP(req.socket.remoteAddress)) {
            return req.socket.remoteAddress;
        }
        if (req.info && this._isIP(req.info.remoteAddress)) {
            return req.info.remoteAddress;
        }
        if (req.requestContext
            && req.requestContext.identity
            && this._isIP(req.requestContext.identity.sourceIp)) {
            return req.requestContext.identity.sourceIp;
        }
        if (req.headers) {
            if (this._isIP(req.headers["Cf-Pseudo-IPv4"])) {
                return req.headers["Cf-Pseudo-IPv4"];
            }
        }
        if (req.raw) {
            return this.getClientIp(req.raw);
        }
        return null;
    }

    ip2int(ip) {
        return ip.split`.`.reduce((int, value) => int * 256 + +value);
    }
}
