import apiCaptcha from "./apiCaptcha";

export default fastify => {
    fastify.post("/api/captcha", apiCaptcha());
};
