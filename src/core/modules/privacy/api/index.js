import apiPolicy from "./apiPolicy.js";

export default (fastify) => {
    fastify.post("/api/privacy/policy", apiPolicy());
};
