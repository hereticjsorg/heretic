import Ajv from "ajv";
import fs from "fs-extra";
import path from "path";
import PolicyForm from "../data/policy.js";

const ajv = new Ajv({
    allErrors: true,
    strict: true,
});
const policyForm = new PolicyForm();
const policyFormValidationSchema = policyForm.getValidationSchema();
const policyFormValidation = ajv.compile(policyFormValidationSchema);

const cache = {};

export default () => ({
    async handler(req, rep) {
        try {
            const validationResult = policyFormValidation(req.body);
            if (!validationResult) {
                return rep.error({
                    form: policyFormValidation.errors,
                });
            }
            let html = false;
            try {
                if (cache[`${req.body.type}-${req.body.language}`]) {
                    html = cache[`${req.body.type}-${req.body.language}`];
                } else {
                    html = (await fs.readFile(path.join(__dirname, `data/policy-${req.body.type}-${req.body.language}.html`), "utf8"))
                        .replace(/\[webmaster\]/gm, this.siteConfig.webmaster ? this.siteConfig.webmaster[req.body.language] || "" : "")
                        .replace(/\[siteTitle\]/gm, this.siteConfig.title ? this.siteConfig.title[req.body.language] || "" : "");
                    cache[`${req.body.type}-${req.body.language}`] = html;
                }
            } catch {
                //
            }
            return rep.code(200).send({
                html,
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
