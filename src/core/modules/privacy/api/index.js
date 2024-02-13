import apiPolicy from "./apiPolicy";

export default fastify => {
    fastify.post("/api/privacy/policy", apiPolicy());
};
