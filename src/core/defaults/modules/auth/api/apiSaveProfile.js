import Ajv from "ajv";
import sharp from "sharp";
import fs from "fs-extra";
import path from "path";
import ProfileForm from "../data/profileForm";
import moduleConfig from "../module.js";

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
                const data = {
                    displayName: req.body.displayName,
                };
                if (req.body.profilePicture) {
                    const profilePicturePath = path.resolve(__dirname, "public", moduleConfig.profilePicture.directory, `profile_${String(authData._id)}.jpg`);
                    try {
                        if (req.body.profilePicture === "clear") {
                            await fs.remove(profilePicturePath);
                        } else {
                            const [, profilePictureData] = req.body.profilePicture.split(/base64,/); // cut data:image/png;base64,
                            const decodedBuffer = Buffer.from(profilePictureData, "base64");
                            const profilePictureBuffer = await sharp(decodedBuffer)
                                .resize(moduleConfig.profilePicture.width, moduleConfig.profilePicture.height)
                                .jpeg({
                                    mozjpeg: true,
                                    quality: 70,
                                })
                                .toBuffer();
                            await fs.writeFile(profilePicturePath, profilePictureBuffer);
                        }
                    } catch {
                        // Ignore
                    }
                }
                await this.mongo.db.collection(this.systemConfig.collections.users).updateOne({
                    _id: authData._id,
                }, {
                    $set: data,
                });
            }
            return rep.success({});
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
