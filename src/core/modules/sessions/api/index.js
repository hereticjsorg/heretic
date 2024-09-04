import moduleConfig from "../module.js";
import apiTableList from "./apiTableList.js";
import apiDataLoad from "./apiDataLoad.js";
import apiDataDelete from "./apiDataDelete.js";
import apiDownload from "./apiDownload.js";
import apiDataExport from "./apiDataExport.js";
import apiLockCheck from "./apiLockCheck.js";
import apiLockList from "./apiLockList.js";

export default (fastify) => {
    if (fastify.systemConfig.auth.admin) {
        fastify.post(`/api/${moduleConfig.id}/list`, apiTableList());
        fastify.post(`/api/${moduleConfig.id}/load`, apiDataLoad());
        fastify.post(`/api/${moduleConfig.id}/export`, apiDataExport());
        fastify.post(`/api/${moduleConfig.id}/delete`, apiDataDelete());
        fastify.get(`/api/${moduleConfig.id}/download`, apiDownload());
        fastify.post(`/api/${moduleConfig.id}/lock/check`, apiLockCheck());
        fastify.get(`/api/${moduleConfig.id}/lock/list`, apiLockList());
    }
};
