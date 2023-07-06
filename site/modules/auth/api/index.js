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

export default fastify => {
    if (fastify.systemConfig.auth.signIn) {
        fastify.post("/api/signIn", apiSignIn());
    }
    if (fastify.systemConfig.auth.signUp) {
        fastify.post(moduleConfig.api.signUp, apiSignUp());
    }
    if (fastify.systemConfig.auth.signIn) {
        fastify.post("/api/signOut", apiSignOut());
    }
    fastify.get("/api/user/getData", apiGetData());
    fastify.post("/api/user/saveProfile", apiSaveProfile());
    fastify.post("/api/user/changePassword", apiChangePassword());
    fastify.post("/api/user/changeEmail", apiChangeEmail());
    fastify.post(moduleConfig.api.restorePassword, apiRestorePassword());
    fastify.post(moduleConfig.api.setPassword, apiSetPassword());
    fastify.post(moduleConfig.api.activate, apiActivate());
};
