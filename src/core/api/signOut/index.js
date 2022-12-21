import apiSignOut from "./apiSignOut";

export default fastify => {
    if (fastify.systemConfig.auth.signIn) {
        fastify.post("/api/signOut", apiSignOut());
    }
};
