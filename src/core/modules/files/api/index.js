import apiCancel from "./apiCancel";
import apiListFiles from "./apiListFiles";
import apiLoad from "./apiLoad";
import apiProcess from "./apiProcess";
import apiSave from "./apiSave";
import apiStatus from "./apiStatus";
import apiUpload from "./apiUpload";

export default fastify => {
    if (fastify.systemConfig.auth.admin) {
        fastify.post("/api/files/list", apiListFiles());
        fastify.post("/api/files/upload", apiUpload());
        fastify.post("/api/files/process", apiProcess());
        fastify.post("/api/files/status", apiStatus());
        fastify.post("/api/files/cancel", apiCancel());
        fastify.post("/api/files/load", apiLoad());
        fastify.post("/api/files/save", apiSave());
    }
};
