import apiGroups from "./apiGroups";
import apiEvents from "./apiEvents";

export default fastify => {
    if (fastify.systemConfig.auth.admin) {
        fastify.get("/api/dataProviders/groups", apiGroups());
        fastify.get("/api/dataProviders/events", apiEvents());
    }
};
