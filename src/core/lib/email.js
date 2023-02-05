const nodemailer = require("nodemailer");
const path = require("path");

export default class {
    constructor(fastify) {
        this.fastify = fastify;
        if (fastify.systemConfig.email) {
            this.transporter = nodemailer.createTransport(fastify.systemConfig.email.config);
        }
    }

    async send(to = "", subject = "", html = "") {
        if (!this.transporter) {
            return null;
        }
        await this.transporter.sendMail({
            from: this.fastify.systemConfig.email.from,
            to, // list of receivers
            subject,
            html,
            attachments: [{
                filename: "logo.png",
                path: path.resolve(__dirname, "data/email-logo.png"),
                cid: "logo@heretic",
            }]
        });
    }
}
