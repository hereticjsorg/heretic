import apiSignIn from "./apiSignIn";

export default fastify => {
    fastify.post("/api/signIn", apiSignIn());
};
