import SignInForm from "../../pages/_signIn/data/signInForm";
import FormValidator from "../../lib/formValidatorServer";
import {
    getClientIp,
} from "../../lib/ip";

const ip2int = ip => ip.split(".").map((octet, index, array) => parseInt(octet, 10) * 256 ** (array.length - index - 1)).reduce((prev, curr) => prev + curr);

export default () => ({
    async handler(req, rep) {
        try {
            const signInForm = new SignInForm();
            const formValidator = new FormValidator(signInForm.getValidationSchema(), signInForm.getFieldsFlat(), this);
            const multipartData = await req.processMultipart();
            const {
                data
            } = formValidator.parseMultipartData(multipartData);
            const validationResult = formValidator.validate();
            if (validationResult) {
                return rep.error({
                    form: validationResult
                });
            }
            const userDb = await req.auth.authorize(data._default.username, data._default.password);
            if (!userDb) {
                return rep.error({
                    message: "error_invalid_credentials"
                }, 403);
            }
            const token = req.auth.generateToken(userDb);
            let ip = getClientIp(req) || null;
            ip = "31.152.171.183";
            console.log("---------------------------");
            console.log(ip);
            if (req.ip) {
                ip = ip2int(ip);
                console.log({
                    ipf: {
                        $gte: ip,
                    },
                    ipt: {
                        $lte: ip
                    },
                });
                console.log(this.systemConfig.collections.geoNetworks);
                const geoRecord = await this.mongo.db.collection(this.systemConfig.collections.geoNetworks).findOne({
                    ipf: {
                        $gte: ip,
                    },
                    ipt: {
                        $lte: ip
                    }
                });
                console.log(geoRecord);
            }
            await this.mongo.db.collection(this.systemConfig.collections.events).insertOne({
                event: "loginSuccess",
                date: new Date(),
                ip,
                geoId: "",
                continent: "",
                country: "",
            });
            return rep.success({
                token,
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
