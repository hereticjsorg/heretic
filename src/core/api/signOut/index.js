import apiSignOut from "./apiSignOut";

export default fastify => {
    fastify.post("/api/signOut", apiSignOut());
};
