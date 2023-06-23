import path from "path";
import FormData from "../data/form";
import ReadLastLines from "#lib/3rdparty/readLastLines";

// eslint-disable-next-line no-eval
const ecosystem = eval("require")(path.resolve(__dirname, "../ecosystem.config.js"));

export default () => ({
    async handler(req, rep) {
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (!authData || !authData.groupData || !authData.groupData.find(i => i.id === "admin" && i.value === true)) {
                return rep.error({
                    message: "Access Denied",
                }, 403);
            }
            const formData = new FormData();
            const options = req.validateTableList(formData);
            if (!options) {
                return rep.error({
                    message: "validation_error"
                });
            }
            const readLastLines = new ReadLastLines();
            let items = [];
            const total = 0;
            const grandTotal = 0;
            try {
                items = (await readLastLines.read(path.resolve(__dirname, `../logs/${ecosystem.logFileName}`), 500)).split(/\n/).map(i => {
                    let item = null;
                    try {
                        item = JSON.parse(i);
                    } catch {
                        // Ignore
                    }
                    return item;
                }).filter(i => i !== null).map(i => ({
                    level: i.level,
                    date: parseInt(i.time / 1000, 10),
                    type: i.req ? "req" : "res",
                    code: i.res && i.res.statusCode ? i.res.statusCode : null,
                    resTime: i.responseTime || null,
                    method: i.req && i.req.method ? i.req.method : null,
                    url: i.req && i.req.url ? i.req.url : null,
                    ip: i.req && i.req.remoteAddress ? i.req.remoteAddress : null,
                    msg: i.msg || null,
                }));
            } catch (e) {
                // Ignore
                // eslint-disable-next-line no-console
                console.log(e);
            }
            return rep.code(200).send({
                items,
                total,
                grandTotal,
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
