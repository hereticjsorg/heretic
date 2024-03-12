import apiContentTableList from "./apiContentTableList";
import apiContentDataSave from "./apiContentDataSave";
import apiContentLockList from "./apiContentLockList";
import apiContentLockCheck from "./apiContentLockCheck";
import apiContentDataLoad from "./apiContentDataLoad";
import apiContent from "./apiContent";

export default fastify => {
    if (fastify.systemConfig.auth.admin) {
        fastify.post(`/api/content/list`, apiContentTableList());
        fastify.post(`/api/content/save`, apiContentDataSave());
        fastify.post(`/api/content/load`, apiContentDataLoad());
        fastify.post(`/api/content/lock/check`, apiContentLockCheck());
        fastify.get(`/api/content/lock/list`, apiContentLockList());
        fastify.post(`/api/content`, apiContent());
    }
};
