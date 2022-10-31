import crypto from "crypto";
import {
    ObjectId
} from "mongodb";

export default class {
    constructor(fastify, req) {
        this.fastify = fastify;
        this.req = req;
        this.methods = Object.freeze({
            HEADERS: Symbol("headers"),
            COOKIE: Symbol("cookie"),
        });
    }

    createHash(data) {
        return new Promise((resolve, reject) => {
            const salt = crypto.randomBytes(8).toString("hex");
            crypto.scrypt(data, salt, 64, (err, derivedKey) => {
                if (err) {
                    reject(err);
                }
                resolve(`${salt }:${derivedKey.toString("hex")}`);
            });
        });
    }

    verifyHash(data, hash) {
        return new Promise((resolve, reject) => {
            const [salt, key] = hash.split(":");
            crypto.scrypt(data, salt, 64, (err, derivedKey) => {
                if (err) {
                    reject(err);
                }
                resolve(key === derivedKey.toString("hex"));
            });
        });
    }

    async authorize(username, password) {
        try {
            const userDb = await this.fastify.mongo.db.collection(this.fastify.siteConfig.collections.users).findOne({
                username: username.toLowerCase(),
            });
            if (!userDb) {
                return null;
            }
            const passwordHashDb = userDb.password;
            if (!await this.verifyHash(`${password}${this.fastify.siteConfig.secret}`, passwordHashDb)) {
                return null;
            }
            if (userDb.sid) {
                return userDb;
            }
            const sid = crypto.randomUUID();
            await this.fastify.mongo.db.collection(this.fastify.siteConfig.collections.users).updateOne({
                _id: userDb._id
            }, {
                $set: {
                    sid,
                }
            });
            return {
                ...userDb,
                sid
            };
        } catch (e) {
            return null;
        }
    }

    generateToken(userDb) {
        const signData = {
            id: String(userDb._id),
            sid: userDb.sid || null,
        };
        if (this.fastify.siteConfig.token.ip && this.req) {
            signData.ip = this.req.ip;
        }
        return this.fastify.jwt.sign(signData, {
            expiresIn: this.fastify.siteConfig.token.expiresIn,
        });
    }

    async getData(method = this.methods.HEADERS) {
        let token = null;
        switch (method) {
        case this.methods.COOKIE:
            token = this.req.cookies[`${this.fastify.siteConfig.id || "heretic"}.authToken`];
            break;
        default:
            token = this.req && this.req.headers && this.req.headers.authorization && typeof this.req.headers.authorization === "string" ? this.req.headers.authorization.replace(/^Bearer /, "") : null;
        }
        let tokenData;
        try {
            tokenData = this.fastify.jwt.verify(token);
        } catch {
            return null;
        }
        // Check IP address
        if (this.fastify.siteConfig.token.ip && this.req && this.req.ip !== tokenData.ip) {
            return null;
        }
        // Query database
        try {
            const userDb = await this.fastify.mongo.db.collection(this.fastify.siteConfig.collections.users).findOne({
                _id: new ObjectId(tokenData.id),
            });
            if (!userDb || userDb.sid !== tokenData.sid) {
                return null;
            }
            if (userDb.groups && Array.isArray(userDb.groups) && userDb.groups.length) {
                const groupsQuery = {
                    $or: userDb.groups.map(g => ({
                        group: g,
                    })),
                };
                const groupData = [];
                const groups = [];
                const groupsDb = await this.fastify.mongo.db.collection(this.fastify.siteConfig.collections.groups).find(groupsQuery).toArray();
                for (const group of groupsDb) {
                    for (const dataItem of group.data) {
                        groupData.push({
                            id: dataItem.id,
                            value: dataItem.value,
                            group: group.group,
                        });
                    }
                    groups.push(group.group);
                }
                userDb.groupData = groupData;
                userDb.groups = groups;
            }
            return userDb;
        } catch {
            return null;
        }
    }
}
