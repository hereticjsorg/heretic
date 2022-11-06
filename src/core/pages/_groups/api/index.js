import moduleConfig from "../admin.js";
import apiTableList from "./apiTableList";
import apiDataLoad from "./apiDataLoad";
import apiDataSave from "./apiDataSave";
import apiDataDelete from "./apiDataDelete";
import apiDownload from "./apiDownload";
import apiDataExport from "./apiDataExport";
import apiLockCheck from "./apiLockCheck.js";
import apiLockList from "./apiLockList.js";

export default fastify => {
    fastify.post(`/api/${moduleConfig.id}/list`, apiTableList());
    fastify.post(`/api/${moduleConfig.id}/load`, apiDataLoad());
    fastify.post(`/api/${moduleConfig.id}/save`, apiDataSave());
    fastify.post(`/api/${moduleConfig.id}/export`, apiDataExport());
    fastify.post(`/api/${moduleConfig.id}/delete`, apiDataDelete());
    fastify.get(`/api/${moduleConfig.id}/download`, apiDownload());
    fastify.post(`/api/${moduleConfig.id}/lock/check`, apiLockCheck());
    fastify.get(`/api/${moduleConfig.id}/lock/list`, apiLockList());
};
