import apiGroups from "./apiGroups";

export default fastify => {
    fastify.get("/api/dataProviders/groups", apiGroups());
};
