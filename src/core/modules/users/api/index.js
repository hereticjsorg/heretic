import apiUsersTableList from "./apiUsersTableList";
import apiUsersDataLoad from "./apiUsersDataLoad";
import apiUsersDataSave from "./apiUsersDataSave";
import apiUsersDataDelete from "./apiUsersDataDelete";
import apiUsersDownload from "./apiUsersDownload";
import apiUsersDataExport from "./apiUsersDataExport";
import apiUsersLockCheck from "./apiUsersLockCheck.js";
import apiUsersLockList from "./apiUsersLockList.js";
import apiGroupsTableList from "./apiGroupsTableList";
import apiGroupsDataLoad from "./apiGroupsDataLoad";
import apiGroupsDataSave from "./apiGroupsDataSave";
import apiGroupsDataDelete from "./apiGroupsDataDelete";
import apiGroupsDownload from "./apiGroupsDownload";
import apiGroupsDataExport from "./apiGroupsDataExport";
import apiGroupsLockCheck from "./apiGroupsLockCheck.js";
import apiGroupsLockList from "./apiGroupsLockList.js";

export default fastify => {
    if (fastify.systemConfig.auth.admin) {
        fastify.post(`/api/users/list`, apiUsersTableList());
        fastify.post(`/api/users/load`, apiUsersDataLoad());
        fastify.post(`/api/users/save`, apiUsersDataSave());
        fastify.post(`/api/users/export`, apiUsersDataExport());
        fastify.post(`/api/users/delete`, apiUsersDataDelete());
        fastify.get(`/api/users/download`, apiUsersDownload());
        fastify.post(`/api/users/lock/check`, apiUsersLockCheck());
        fastify.get(`/api/users/lock/list`, apiUsersLockList());
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
