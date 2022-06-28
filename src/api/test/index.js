import apiCaptcha from "./apiTest";

export default fastify => {
    fastify.post("/api/test", apiCaptcha());
};
