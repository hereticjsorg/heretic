import apiListFiles from "./apiListFiles";

export default fastify => {
    if (fastify.systemConfig.auth.admin) {
        fastify.post("/api/files/list", apiListFiles());
    }
};
