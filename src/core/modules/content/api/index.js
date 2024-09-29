import apiContentTableList from "./apiContentTableList.js";
import apiContentDataSave from "./apiContentDataSave.js";
import apiContentLockList from "./apiContentLockList.js";
import apiContentLockCheck from "./apiContentLockCheck.js";
import apiContentDataLoad from "./apiContentDataLoad.js";
import apiContentDataDelete from "./apiContentDataDelete.js";
import apiContent from "./apiContent.js";

export default (fastify) => {
    if (fastify.systemConfig.auth.admin) {
        fastify.post(`/api/content/list`, apiContentTableList());
        fastify.post(`/api/content/save`, apiContentDataSave());
        fastify.post(`/api/content/load`, apiContentDataLoad());
        fastify.post(`/api/content/delete`, apiContentDataDelete());
        fastify.post(`/api/content/lock/check`, apiContentLockCheck());
        fastify.get(`/api/content/lock/list`, apiContentLockList());
        fastify.post(`/api/content`, apiContent());
    }
};
