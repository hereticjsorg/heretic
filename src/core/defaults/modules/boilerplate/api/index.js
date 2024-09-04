import moduleConfig from "../module.js";
import apiTableList from "./apiTableList.js";
import apiDataLoad from "./apiDataLoad.js";
import apiDataSave from "./apiDataSave.js";
import apiDataBulkSave from "./apiDataBulkSave.js";
import apiDataDelete from "./apiDataDelete.js";
import apiDownload from "./apiDownload.js";
import apiDataExport from "./apiDataExport.js";
import apiRecycleBinList from "./apiRecycleBinList.js";
import apiRecycleBinRestore from "./apiRecycleBinRestore.js";
import apiRecycleBinDelete from "./apiRecycleBinDelete.js";
import apiRecycleBinDeleteAll from "./apiRecycleBinDeleteAll.js";
import apiHistoryList from "./apiHistoryList.js";
import apiHistoryDelete from "./apiHistoryDelete.js";
import apiHistoryRestore from "./apiHistoryRestore.js";
import apiLockCheck from "./apiLockCheck.js";
import apiLockList from "./apiLockList.js";
import apiDataImport from "./apiDataImport.js";

export default (fastify) => {
    fastify.post(`/api/${moduleConfig.id}/list`, apiTableList());
    fastify.post(`/api/${moduleConfig.id}/load`, apiDataLoad());
    fastify.post(`/api/${moduleConfig.id}/save`, apiDataSave());
    fastify.post(`/api/${moduleConfig.id}/bulkSave`, apiDataBulkSave());
    fastify.post(`/api/${moduleConfig.id}/export`, apiDataExport());
    fastify.post(`/api/${moduleConfig.id}/delete`, apiDataDelete());
    fastify.get(`/api/${moduleConfig.id}/download`, apiDownload());
    fastify.post(
        `/api/${moduleConfig.id}/recycleBin/list`,
        apiRecycleBinList(),
    );
    fastify.post(
        `/api/${moduleConfig.id}/recycleBin/restore`,
        apiRecycleBinRestore(),
    );
    fastify.post(
        `/api/${moduleConfig.id}/recycleBin/delete`,
        apiRecycleBinDelete(),
    );
    fastify.post(
        `/api/${moduleConfig.id}/recycleBin/deleteAll`,
        apiRecycleBinDeleteAll(),
    );
    fastify.post(`/api/${moduleConfig.id}/history/list`, apiHistoryList());
    fastify.post(`/api/${moduleConfig.id}/history/delete`, apiHistoryDelete());
    fastify.post(
        `/api/${moduleConfig.id}/history/restore`,
        apiHistoryRestore(),
    );
    fastify.post(`/api/${moduleConfig.id}/lock/check`, apiLockCheck());
    fastify.get(`/api/${moduleConfig.id}/lock/list`, apiLockList());
    fastify.post(`/api/${moduleConfig.id}/import`, apiDataImport());
};
