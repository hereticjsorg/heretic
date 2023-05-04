import Ajv from "ajv";
import ProfileForm from "./data/profileForm";

const ajv = new Ajv({
    allErrors: true,
    strict: true,
});
const profileForm = new ProfileForm();
const profileFormValidationSchema = profileForm.getValidationSchema();
const profileFormValidation = ajv.compile(profileFormValidationSchema);

export default () => ({
    async handler(req, rep) {
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (!authData) {
                return rep.error({
                    message: "Access Denied",
                }, 403);
            }
            const validationResult = profileFormValidation(req.body);
            if (!validationResult) {
                return rep.error({
                    form: profileFormValidation.errors,
                });
            }
            const userDb = await this.mongo.db.collection(this.systemConfig.collections.users).findOne({
                _id: authData._id,
            });
            if (!await req.auth.verifyHash(`${req.body.passwordCurrent}${this.systemConfig.secret}`, userDb.password)) {
                return rep.error({
                    form: [{
                        instancePath: "passwordCurrent",
                        keyword: "invalidPassword",
                        tab: "_default",
                    }],
                }, 403);
            }
            if (!this.systemConfig.demo) {
                await this.mongo.db.collection(this.systemConfig.collections.users).updateOne({
                    _id: authData._id,
                }, {
                    $set: {
                        displayName: req.body.displayName,
                    },
                });
            }
            return rep.success({});
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
