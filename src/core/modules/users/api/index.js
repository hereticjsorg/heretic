import apiUsersTableList from "./apiUsersTableList.js";
import apiUsersDataLoad from "./apiUsersDataLoad.js";
import apiUsersDataSave from "./apiUsersDataSave.js";
import apiUsersDataDelete from "./apiUsersDataDelete.js";
import apiUsersDownload from "./apiUsersDownload.js";
import apiUsersDataExport from "./apiUsersDataExport.js";
import apiUsersLockCheck from "./apiUsersLockCheck.js";
import apiUsersLockList from "./apiUsersLockList.js";
import apiUsersDisable2FA from "./apiUsersDisable2FA.js";
import apiGroupsTableList from "./apiGroupsTableList.js";
import apiGroupsDataLoad from "./apiGroupsDataLoad.js";
import apiGroupsDataSave from "./apiGroupsDataSave.js";
import apiGroupsDataDelete from "./apiGroupsDataDelete.js";
import apiGroupsDownload from "./apiGroupsDownload.js";
import apiGroupsDataExport from "./apiGroupsDataExport.js";
import apiGroupsLockCheck from "./apiGroupsLockCheck.js";
import apiGroupsLockList from "./apiGroupsLockList.js";

export default (fastify) => {
    if (fastify.systemConfig.auth.admin) {
        fastify.post(`/api/users/list`, apiUsersTableList());
        fastify.post(`/api/users/load`, apiUsersDataLoad());
        fastify.post(`/api/users/save`, apiUsersDataSave());
        fastify.post(`/api/users/export`, apiUsersDataExport());
        fastify.post(`/api/users/delete`, apiUsersDataDelete());
        fastify.get(`/api/users/download`, apiUsersDownload());
        fastify.post(`/api/users/lock/check`, apiUsersLockCheck());
        fastify.get(`/api/users/lock/list`, apiUsersLockList());
        fastify.post(`/api/users/disable2FA`, apiUsersDisable2FA());
        fastify.post(`/api/groups/list`, apiGroupsTableList());
        fastify.post(`/api/groups/load`, apiGroupsDataLoad());
        fastify.post(`/api/groups/save`, apiGroupsDataSave());
        fastify.post(`/api/groups/export`, apiGroupsDataExport());
        fastify.post(`/api/groups/delete`, apiGroupsDataDelete());
        fastify.get(`/api/groups/download`, apiGroupsDownload());
        fastify.post(`/api/groups/lock/check`, apiGroupsLockCheck());
        fastify.get(`/api/groups/lock/list`, apiGroupsLockList());
    }
};
