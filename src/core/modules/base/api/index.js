import apiGroups from "./apiGroups";
import apiSysInfo from "./apiSysInfo.js";
import apiDataProviderEvents from "./apiDataProviderEvents.js";
import apiDataProviderGroups from "./apiDataProviderGroups.js";
import apiCaptcha from "./apiCaptcha.js";
import apiRestart from "./apiRestart.js";
import apiUpdate from "./apiUpdate.js";
import apiRebuild from "./apiRebuild.js";
import apiStatus from "./apiStatus.js";
import apiContact from "./apiContact.js";
import apiUploadImage from "./apiUploadImage.js";

export default (fastify) => {
    fastify.get("/api/captcha", apiCaptcha());
    if (fastify.systemConfig.auth.admin) {
        fastify.get("/api/admin/groups", apiGroups());
        fastify.get("/api/admin/sysInfo", apiSysInfo());
        fastify.get("/api/dataProviders/groups", apiDataProviderGroups());
        fastify.get("/api/dataProviders/events", apiDataProviderEvents());
        fastify.get("/api/admin/restart", apiRestart());
        fastify.get("/api/admin/update", apiUpdate());
        fastify.get("/api/admin/rebuild", apiRebuild());
        fastify.post("/api/admin/status", apiStatus());
        fastify.post("/api/contact", apiContact());
        fastify.post("/api/admin/upload/image", apiUploadImage());
    }
};
