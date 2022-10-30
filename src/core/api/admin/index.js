import apiGroups from "./apiGroups";

export default fastify => {
    fastify.get("/api/admin/groups", apiGroups());
};
