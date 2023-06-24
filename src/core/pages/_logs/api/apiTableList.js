import path from "path";
import {
    v4 as uuid,
} from "uuid";
import {
    sortBy
} from "lodash";
import {
    destr,
} from "destr";
import FormData from "../data/form";
import ServerUtils from "#lib/serverUtils";

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
            let itemsAll = [];
            let items = [];
            try {
                itemsAll = (await ServerUtils.readLastStringsFromFile(path.resolve(__dirname, `../logs/${ecosystem.logFileName}`), 50000));
                itemsAll = itemsAll.map(i => {
                        let item = null;
                        try {
                            item = destr(i);
                        } catch {
                            // Ignore
                        }
                        return item;
                    })
                    .filter(i => i !== null)
                    .map(i => ({
                        _id: uuid(),
                        level: i.level,
                        id: i.reqId || null,
                        date: parseInt(i.time / 1000, 10),
                        type: i.req ? "req" : "res",
                        code: i.res && i.res.statusCode ? i.res.statusCode : null,
                        resTime: i.responseTime ? parseFloat(i.responseTime).toFixed(3) : null,
                        method: i.req && i.req.method ? i.req.method : null,
                        url: i.req && i.req.url ? i.req.url : null,
                        ip: i.req && i.req.remoteAddress ? i.req.remoteAddress : null,
                        message: i.msg || null,
                    }));
                items = itemsAll
                    .filter(i => req.getFilterData(formData, i));
                items = sortBy(items, [Object.keys(options.sort)[0]]);
                if (options.sort[Object.keys(options.sort)[0]] === -1) {
                    items.reverse();
                }
            } catch {
                // Ignore
            }
            return rep.code(200).send({
                items: items.filter(
                    (_, index) => index >= options.skip && index < options.skip + options.limit,
                ),
                total: items.length,
                grandTotal: itemsAll.length,
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
