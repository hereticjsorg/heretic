import apiGetData from "./apiGetData";
import apiSaveProfile from "./apiSaveProfile";
import apiChangePassword from "./apiChangePassword";
import apiChangeEmail from "./apiChangeEmail";
import apiActivate from "./apiActivate";

export default fastify => {
    fastify.get("/api/user/getData", apiGetData());
    fastify.post("/api/user/saveProfile", apiSaveProfile());
    fastify.post("/api/user/changePassword", apiChangePassword());
    fastify.post("/api/user/changeEmail", apiChangeEmail());
    fastify.post("/api/user/activate", apiActivate());
};
