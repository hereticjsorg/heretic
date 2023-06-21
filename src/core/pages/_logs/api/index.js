import moduleConfig from "../admin.js";
import apiTableList from "./apiTableList.js";
import apiDataLoad from "./apiDataLoad.js";
import apiDownload from "./apiDownload.js";
import apiDataExport from "./apiDataExport.js";

export default fastify => {
    if (fastify.systemConfig.auth.admin) {
        fastify.post(`/api/${moduleConfig.id}/list`, apiTableList());
        fastify.post(`/api/${moduleConfig.id}/load`, apiDataLoad());
        fastify.post(`/api/${moduleConfig.id}/export`, apiDataExport());
        fastify.get(`/api/${moduleConfig.id}/download`, apiDownload());
    }
};
