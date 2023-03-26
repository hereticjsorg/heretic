import apiGetData from "./apiGetData";

export default fastify => {
    fastify.get("/api/user/getData", apiGetData());
};
