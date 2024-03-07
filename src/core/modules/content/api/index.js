import apiContentTableList from "./apiContentTableList";

export default fastify => {
    if (fastify.systemConfig.auth.admin) {
        fastify.post(`/api/content/list`, apiContentTableList());
    }
};
