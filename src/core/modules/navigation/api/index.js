import moduleConfig from "../module.js";
import apiNavigationSave from "./apiNavigationSave.js";

export default (fastify) => {
    if (fastify.systemConfig.auth.admin) {
        fastify.post(`/api/${moduleConfig.id}/save`, apiNavigationSave());
    }
};
