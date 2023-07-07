import apiGroups from "./apiGroups";
import apiSysInfo from "./apiSysInfo";
import apiDataProviderEvents from "./apiDataProviderEvents";
import apiDataProviderGroups from "./apiDataProviderGroups";
import apiCaptcha from "./apiCaptcha";

export default fastify => {
    fastify.get("/api/captcha", apiCaptcha());
    if (fastify.systemConfig.auth.admin) {
        fastify.get("/api/admin/groups", apiGroups());
        fastify.get("/api/admin/sysInfo", apiSysInfo());
        fastify.get("/api/dataProviders/groups", apiDataProviderGroups());
        fastify.get("/api/dataProviders/events", apiDataProviderEvents());
    }
};
