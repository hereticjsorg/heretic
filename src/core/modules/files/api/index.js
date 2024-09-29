import apiDownload from "./apiDownload.js";
import apiCancel from "./apiCancel.js";
import apiListFiles from "./apiListFiles.js";
import apiLoad from "./apiLoad.js";
import apiProcess from "./apiProcess.js";
import apiSave from "./apiSave.js";
import apiStatus from "./apiStatus";
import apiUpload from "./apiUpload.js";

export default (fastify) => {
    if (fastify.systemConfig.auth.admin) {
        fastify.post("/api/files/list", apiListFiles());
        fastify.post("/api/files/upload", apiUpload());
        fastify.post("/api/files/process", apiProcess());
        fastify.post("/api/files/status", apiStatus());
        fastify.post("/api/files/cancel", apiCancel());
        fastify.post("/api/files/load", apiLoad());
        fastify.post("/api/files/save", apiSave());
        fastify.get(
            `${fastify.systemConfig.routes.admin}/files/download`,
            apiDownload(),
        );
    }
};
