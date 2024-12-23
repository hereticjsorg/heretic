import apiSearchEngine from "./apiSearchEngine.js";

export default (fastify) => {
    if (
        fastify.systemConfig.redis.enabled &&
        fastify.systemConfig.redis.stack
    ) {
        fastify.post("/api/search", apiSearchEngine());
    }
};
