import apiListFiles from "./apiListFiles";
import apiProcess from "./apiProcess";
import apiUpload from "./apiUpload";

export default fastify => {
    if (fastify.systemConfig.auth.admin) {
        fastify.post("/api/files/list", apiListFiles());
        fastify.post("/api/files/upload", apiUpload());
        fastify.post("/api/files/process", apiProcess());
    }
};
