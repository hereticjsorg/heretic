import apiGroups from "./apiGroups";
import apiSysInfo from "./apiSysInfo";
import apiDataProviderEvents from "./apiDataProviderEvents";
import apiDataProviderGroups from "./apiDataProviderGroups";
import apiCaptcha from "./apiCaptcha";
import apiRestart from "./apiRestart";
import apiUpdate from "./apiUpdate";
import apiRebuild from "./apiRebuild";
import apiStatus from "./apiStatus";

export default fastify => {
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
    }
};
