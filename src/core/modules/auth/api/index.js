import moduleConfig from "../module";
import apiSignIn from "./apiSignIn";
import apiSignUp from "./apiSignUp";
import apiSignOut from "./apiSignOut";
import apiGetData from "./apiGetData";
import apiSaveProfile from "./apiSaveProfile";
import apiChangePassword from "./apiChangePassword";
import apiChangeEmail from "./apiChangeEmail";
import apiRestorePassword from "./apiRestorePassword";
import apiSetPassword from "./apiSetPassword";
import apiActivate from "./apiActivate";
import apiGetData2FA from "./apiGetData2FA";
import apiSetData2FA from "./apiSetData2FA";
import apiCheckOTP from "./apiCheckOTP";
import apiDisable2FA from "./apiDisable2FA";
import apiDisable2FARecovery from "./apiDisable2FARecovery";

export default (fastify) => {
    if (fastify.systemConfig.auth.signIn) {
        fastify.post("/api/signIn", apiSignIn());
    }
    if (fastify.systemConfig.auth.signUp) {
        fastify.post(moduleConfig.api.signUp, apiSignUp());
    }
    if (fastify.systemConfig.auth.signIn) {
        fastify.post("/api/signOut", apiSignOut());
    }
    fastify.get(moduleConfig.api.getData, apiGetData());
    fastify.post("/api/user/saveProfile", apiSaveProfile());
    fastify.post("/api/user/changePassword", apiChangePassword());
    fastify.post("/api/user/changeEmail", apiChangeEmail());
    fastify.post(moduleConfig.api.restorePassword, apiRestorePassword());
    fastify.post(moduleConfig.api.setPassword, apiSetPassword());
    fastify.post(moduleConfig.api.activate, apiActivate());
    fastify.get(moduleConfig.api.getData2FA, apiGetData2FA());
    fastify.post(moduleConfig.api.setData2FA, apiSetData2FA());
    fastify.post(moduleConfig.api.checkOTP, apiCheckOTP());
    fastify.post(moduleConfig.api.disable2FA, apiDisable2FA());
    fastify.post(moduleConfig.api.disable2FARecovery, apiDisable2FARecovery());
};
