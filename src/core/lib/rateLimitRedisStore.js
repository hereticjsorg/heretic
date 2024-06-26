/* eslint-disable func-names */

function RedisStore(redis, timeWindow, continueExceeding, key) {
    this.redis = redis;
    this.timeWindow = timeWindow;
    this.continueExceeding = continueExceeding;
    this.key = key;
}

RedisStore.prototype.redisIncrement = async function (key, timeWindow, max, ban, continueExceeding = true) {
    const current = await this.redis.incr(key);
    const ttl = await this.redis.pTTL(key);
    if (ttl === -1 || (continueExceeding && current > max)) {
        await this.redis.pExpire(key, timeWindow);
    }
    return {
        current,
        ttl,
        ban: ban !== -1 && (current - max > ban),
    };
};

RedisStore.prototype.incr = function (ip, cb, max, ban) {
    this.redisIncrement(`${this.key}${ip}`, this.timeWindow, max, ban).then(current => cb(null, current));
};

RedisStore.prototype.child = function (routeOptions) {
    return new RedisStore(this.redis, routeOptions.timeWindow, routeOptions.continueExceeding, `${this.redis.hereticId}${this.key}${routeOptions.routeInfo.method}${routeOptions.routeInfo.url}-`);
};

module.exports = RedisStore;
