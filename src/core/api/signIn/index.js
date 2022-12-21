import apiSignIn from "./apiSignIn";

export default fastify => {
    if (fastify.systemConfig.auth.signIn) {
        fastify.post("/api/signIn", apiSignIn());
    }
};
