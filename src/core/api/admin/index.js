import apiGroups from "./apiGroups";
import apiSysInfo from "./apiSysInfo";

export default fastify => {
    fastify.get("/api/admin/groups", apiGroups());
    fastify.get("/api/admin/sysInfo", apiSysInfo());
};
