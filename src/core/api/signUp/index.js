import apiSignUp from "./apiSignUp";

export default fastify => {
    if (fastify.systemConfig.auth.signUp) {
        fastify.post("/api/signUp", apiSignUp());
    }
};
