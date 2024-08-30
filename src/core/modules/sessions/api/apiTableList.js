import { ObjectId } from "mongodb";
import FormData from "../data/form";
import moduleConfig from "../module.js";

export default () => ({
    async handler(req, rep) {
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (
                !authData ||
                !authData.groupData ||
                !authData.groupData.find(
                    (i) => i.id === "admin" && i.value === true,
                )
            ) {
                return rep.error(
                    {
                        message: "Access Denied",
                    },
                    403,
                );
            }
            const formData = new FormData();
            const options = req.validateTableList(formData);
            if (!options) {
                return rep.error({
                    message: "validation_error",
                });
            }
            options.projection.userId = 1;
            const query = req.generateQuery(formData);
            const grandTotal = await this.mongo.db
                .collection(moduleConfig.collections.sessions)
                .countDocuments({
                    deleted: {
                        $exists: false,
                    },
                });
            const total = await this.mongo.db
                .collection(moduleConfig.collections.sessions)
                .countDocuments(query);
            const items = await this.mongo.db
                .collection(moduleConfig.collections.sessions)
                .find(query, options)
                .toArray();
            const usersQuery = [];
            for (const item of items) {
                if (item.userId && usersQuery.indexOf(item.userId) === -1) {
                    usersQuery.push(item.userId);
                }
            }
            if (usersQuery.length) {
                const usersData = await this.mongo.db
                    .collection(this.systemConfig.collections.users)
                    .find(
                        {
                            $or: usersQuery.map((i) => ({
                                _id: new ObjectId(i),
                            })),
                        },
                        {
                            projection: {
                                _id: 1,
                                username: 1,
                            },
                        },
                    )
                    .toArray();
                for (const item of items) {
                    if (item.userId) {
                        const userData = usersData.find(
                            (i) => String(i._id) === item.userId,
                        );
                        if (
                            userData &&
                            item.username &&
                            item.username !== userData.username
                        ) {
                            item.username = `${item.username} (${userData.username})`;
                        }
                    }
                }
            }
            return rep.code(200).send({
                items: req.processDataList(items, formData.getFieldsFlat()),
                total,
                grandTotal,
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    },
});
