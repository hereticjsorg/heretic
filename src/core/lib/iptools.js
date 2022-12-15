/* eslint-disable max-classes-per-file */
/* eslint-disable no-bitwise */
// Based on: https://github.com/pbojinov/request-ip
// The MIT License (MIT), copyright (c) 2022 Petar Bojinov - petarbojinov+github@gmail.com
// Code portions: https://github.com/Scorpil/netmask6

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

    _groupsToBigInt(_groups, ipData) {
        const groups = _groups.map(BigInt);
        const groupSize = BigInt(parseInt(ipData.groupSize, 10));
        let bigInt = BigInt(0);
        groups.forEach(group => {
            if (bigInt > 0) {
                bigInt <<= groupSize;
            }
            bigInt += group;
        });
        return bigInt;
    }

    _bigIntToGroups(_bigInt, _groupSize) {
        const groupSize = BigInt(parseInt(_groupSize, 10));
        const mask = 2n ** groupSize - 1n;
        let bigInt = BigInt(_bigInt);
        const groups = [];
        while (bigInt > 0) {
            groups.push(Number(bigInt & mask));
            bigInt >>= groupSize;
        }
        return groups.reverse();
    }

    _groupsToString(groups, ipData) {
        return groups
            .map(group => group.toString(ipData.groupBase).padStart(4, "0"))
            .join(ipData.groupDivider);
    }

    _zPadGroups(groups, length) {
        while (groups.length < length) {
            groups.unshift(0);
        }
        return groups;
    }

    _parseToGroups(ipStr, ipData) {
        const groupsStr = ipStr.split(ipData.groupDivider);
        if (groupsStr.length !== ipData.groupCount) {
            throw new Error(`Incorrect format: expected ${ipData.groupCount} groups, found ${groupsStr.length} instead`);
        }
        const groups = groupsStr.map(groupStr => {
            const groupDec = parseInt(groupStr, ipData.groupBase) || 0;
            if (Number.isNaN(groupDec)) {
                throw new Error(`Failed to parse IP group ${groupStr}`);
            }
            return groupDec;
        });
        return groups;
    }

    parse(netmask) {
        const parts = netmask.split("/");
        if (parts.length !== 2) {
            throw new Error("Incorrect argument format: failed to spit IP/mask");
        }
        // eslint-disable-next-line prefer-const
        let [ipStr, bitmaskStr] = parts;
        const bitmask = parseInt(bitmaskStr, 10);
        if (Number.isNaN(bitmask)) {
            throw new Error("Failed to parse bitmask");
        }
        const ipVersion = ipStr.match(/:/) ? 6 : 4;
        const ipData = {
            version: ipVersion,
            groupDivider: ipVersion === 6 ? ":" : ".",
            groupBase: ipVersion === 6 ? 16 : 10,
            groupCount: ipVersion === 6 ? 8 : 4,
            addressSize: ipVersion === 6 ? 128 : 32,
        };
        ipData.groupSize = ipData.addressSize / ipData.groupCount;
        if (ipVersion === 6) {
            const ipStrArr = ipStr.split(/:/);
            if (ipStrArr.length < ipData.groupCount) {
                for (let i = 0; i < ipData.groupCount - ipStrArr.length; i += 1) {
                    ipStr += ":";
                }
            }
        }
        const groups = this._parseToGroups(ipStr, ipData);
        const asBigInt = this._groupsToBigInt(groups, ipData);
        const maskRemainder = BigInt(ipData.addressSize - bitmask);
        // eslint-disable-next-line no-mixed-operators
        const firstIpBigInt = asBigInt >> maskRemainder << maskRemainder;
        const firstIpGroups = this._zPadGroups(
            this._bigIntToGroups(firstIpBigInt, ipData.groupSize),
            ipData.groupCount,
        );
        const lastIpGroups = this._bigIntToGroups(
            asBigInt | (2n ** maskRemainder - 1n),
            ipData.groupSize,
        );
        const ipFirstInt = this._groupsToBigInt(firstIpGroups, ipData);
        const ipLastInt = this._groupsToBigInt(lastIpGroups, ipData);
        return {
            ipFirst: this._groupsToString(firstIpGroups, ipData),
            ipLast: this._groupsToString(lastIpGroups, ipData),
            ipFistInt: ipVersion === 6 ? ipFirstInt : parseInt(ipFirstInt, 10),
            ipLastInt: ipVersion === 6 ? ipLastInt : parseInt(ipLastInt, 10),
        };
    }
}
