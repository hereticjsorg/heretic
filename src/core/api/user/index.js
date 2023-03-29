import apiGetData from "./apiGetData";
import apiSaveProfile from "./apiSaveProfile";

export default fastify => {
    fastify.get("/api/user/getData", apiGetData());
    fastify.post("/api/user/saveProfile", apiSaveProfile());
};
