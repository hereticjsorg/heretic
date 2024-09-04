import moduleConfig from "../module.js";
import apiSignIn from "./apiSignIn.js";
import apiSignUp from "./apiSignUp.js";
import apiSignOut from "./apiSignOut.js";
import apiGetData from "./apiGetData.js";
import apiSaveProfile from "./apiSaveProfile.js";
import apiChangePassword from "./apiChangePassword.js";
import apiChangeEmail from "./apiChangeEmail.js";
import apiRestorePassword from "./apiRestorePassword.js";
import apiSetPassword from "./apiSetPassword.js";
import apiActivate from "./apiActivate.js";
import apiGetData2FA from "./apiGetData2FA.js";
import apiSetData2FA from "./apiSetData2FA.js";
import apiCheckOTP from "./apiCheckOTP.js";
import apiDisable2FA from "./apiDisable2FA.js";
import apiDisable2FARecovery from "./apiDisable2FARecovery.js";

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
