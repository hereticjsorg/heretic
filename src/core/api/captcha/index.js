import apiCaptcha from "./apiCaptcha";

export default fastify => {
    fastify.get("/api/captcha", apiCaptcha());
};
