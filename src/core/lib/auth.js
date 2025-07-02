import crypto from "crypto";
import { ObjectId } from "mongodb";
import argon2 from "argon2";
import { addSeconds } from "date-fns";
import IpTools from "./iptools";

export default class {
    constructor(fastify, req) {
        this.fastify = fastify;
        this.req = req;
        this.methods = Object.freeze({
            HEADERS: Symbol("headers"),
            COOKIE: Symbol("cookie"),
        });
        this.ipTools = new IpTools();
    }

    async createHash(data) {
        if (!this.fastify) {
            this.fastify = {
                systemConfig: require("#etc/system.js"),
            };
        }
        if (this.fastify.systemConfig.hashMethod === "argon2") {
            return argon2.hash(data);
        }
        return new Promise((resolve, reject) => {
            const salt = crypto.randomBytes(16).toString("hex");
            crypto.scrypt(data, salt, 64, (err, derivedKey) => {
                if (err) {
                    reject(err);
                }
                resolve(`${salt}:${derivedKey.toString("hex")}`);
            });
        });
    }

    async verifyHash(data, hash) {
        if (this.fastify.systemConfig.hashMethod === "argon2") {
            return argon2.verify(hash, data);
        }
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

    async authorize(username, password = null, uid = null) {
        if (this.fastify.systemConfig.mongo.enabled) {
            try {
                let userDb;
                if (uid) {
                    userDb = await this.fastify.mongo.db
                        .collection(this.fastify.systemConfig.collections.users)
                        .findOne({
                            _id: new ObjectId(uid),
                        });
                } else if (username.match(/@/)) {
                    userDb = await this.fastify.mongo.db
                        .collection(this.fastify.systemConfig.collections.users)
                        .findOne({
                            email: username.toLowerCase(),
                        });
                } else {
                    userDb = await this.fastify.mongo.db
                        .collection(this.fastify.systemConfig.collections.users)
                        .findOne({
                            username: username.toLowerCase(),
                        });
                }
                if (!userDb || !userDb.active) {
                    return null;
                }
                if (password !== null) {
                    const passwordHashDb = userDb.password;
                    if (
                        !(await this.verifyHash(
                            `${password}${this.fastify.systemConfig.secret}`,
                            passwordHashDb,
                        ))
                    ) {
                        return null;
                    }
                }
                const sid = crypto.randomUUID();
                const clientIp = this.ipTools.getClientIp(this.req) || null;
                await this.fastify.mongo.db
                    .collection(this.fastify.systemConfig.collections.sessions)
                    .insertOne({
                        _id: sid,
                        userId: String(userDb._id),
                        username: userDb.username,
                        createdAt: new Date(),
                        dateEnd: addSeconds(
                            new Date(),
                            this.fastify.systemConfig.sessionTTL,
                        ),
                        ip: clientIp,
                    });
                return {
                    ...userDb,
                    sid,
                };
            } catch {
                return null;
            }
        }
        return null;
    }

    generateToken(uid, sid, extraData = {}) {
        const signData = {
            uid,
            sid,
            ...extraData,
        };
        const clientIp = this.ipTools.getClientIp(this.req) || null;
        if (clientIp) {
            signData.ip = clientIp;
        }
        return this.fastify.jwt.sign(signData, {
            expiresIn: this.fastify.systemConfig.token.expiresIn,
        });
    }

    async getData(method = this.methods.HEADERS) {
        if (this.fastify.systemConfig.mongo.enabled) {
            let token = null;
            switch (method) {
                case this.methods.COOKIE:
                    token =
                        this.req.cookies[
                            `${this.fastify.systemConfig.id || "heretic"}.authToken`
                        ];
                    break;
                default:
                    token =
                        this.req &&
                        this.req.headers &&
                        this.req.headers.authorization &&
                        typeof this.req.headers.authorization === "string"
                            ? this.req.headers.authorization.replace(
                                  /^Bearer /,
                                  "",
                              )
                            : null;
            }
            let tokenData;
            try {
                tokenData = this.fastify.jwt.verify(token);
            } catch {
                return null;
            }
            // Check IP address
            const clientIp = this.req
                ? this.ipTools.getClientIp(this.req) || null
                : null;
            if (
                this.fastify.systemConfig.token.ip &&
                clientIp !== tokenData.ip
            ) {
                return null;
            }
            // Query database
            try {
                const sessionDb = await this.fastify.mongo.db
                    .collection(this.fastify.systemConfig.collections.sessions)
                    .findOne({
                        _id: tokenData.sid,
                    });
                if (!sessionDb) {
                    return null;
                }
                const userDb = await this.fastify.mongo.db
                    .collection(this.fastify.systemConfig.collections.users)
                    .findOne({
                        _id: new ObjectId(tokenData.uid),
                    });
                if (!userDb || !userDb.active) {
                    return null;
                }
                if (
                    userDb.groups &&
                    Array.isArray(userDb.groups) &&
                    userDb.groups.length
                ) {
                    const groupsQuery = {
                        $or: userDb.groups.map((g) => ({
                            group: g,
                        })),
                    };
                    const groupData = [];
                    const groups = [];
                    const groupsDb = await this.fastify.mongo.db
                        .collection(
                            this.fastify.systemConfig.collections.groups,
                        )
                        .find(groupsQuery)
                        .toArray();
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
                userDb.session = sessionDb;
                userDb.tfaConfigured = !!userDb.tfaConfig;
                return userDb;
            } catch {
                return null;
            }
        }
        return null;
    }
}
