import apiLogin from "./apiLogin";

export default fastify => {
    fastify.post("/api/login", apiLogin());
};
