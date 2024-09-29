import moduleConfig from "../module.js";
import apiTableList from "./apiTableList.js";

export default (fastify) => {
    if (fastify.systemConfig.auth.admin) {
        fastify.post(`/api/${moduleConfig.id}/list`, apiTableList());
    }
};
