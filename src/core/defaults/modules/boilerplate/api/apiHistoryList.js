import { ObjectId } from "mongodb";
import FormData from "../data/form";
import moduleConfig from "../module";
import utils from "./utils";

export default () => ({
    async handler(req, rep) {
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (!authData) {
                return rep.error({}, 403);
            }
            if (!req.validateHistoryList()) {
                return rep.error({
                    message: "validation_error",
                });
            }
            const formData = new FormData();
            const queryRef = {
                $and: [
                    {
                        _id: new ObjectId(req.body.id),
                    },
                ],
            };
            queryRef.$and.push(utils.filter({}, authData) || {});
            const refDb = await this.mongo.db
                .collection(moduleConfig.collections.main)
                .findOne(queryRef);
            if (!refDb) {
                return rep.error({
                    message: "notFound",
                });
            }
            const query = {
                recordId: req.body.id,
            };
            const options = {
                skip: (req.body.page - 1) * moduleConfig.options.itemsPerPage,
                limit: moduleConfig.options.itemsPerPage,
                projection: {
                    _id: 1,
                    recordId: 1,
                    userId: 1,
                    updated: 1,
                    changes: 1,
                },
                sort: {
                    updated: -1,
                },
            };
            const restrictedFields = formData.getRestrictedFields
                ? formData.getRestrictedFields()
                : [];
            const restrictedAreas = formData.getRestrictedAreas
                ? formData.getRestrictedAreas()
                : [];
            const { access } = utils.getAccessData(
                restrictedFields,
                restrictedAreas,
                formData.getFieldsArea ? formData.getFieldsArea() : {},
                authData,
                options,
            );
            const total = await this.mongo.db
                .collection(this.systemConfig.collections.history)
                .countDocuments(query);
            const items = (
                await this.mongo.db
                    .collection(this.systemConfig.collections.history)
                    .find(query, options)
                    .toArray()
            ).map((i) => {
                if (i.changes && Array.isArray(i.changes)) {
                    for (const item of i.changes) {
                        if (access[item.id] === false) {
                            item.valueOld =
                                formData.getMagicStringAccessDenied();
                            item.valueNew =
                                formData.getMagicStringAccessDenied();
                        }
                    }
                }
                return i;
            });
            const usersQuery = {
                $or: [],
            };
            [...new Set(items.map((i) => i.userId))].map((i) =>
                usersQuery.$or.push({
                    _id: new ObjectId(i),
                }),
            );
            if (usersQuery.$or.length) {
                const users = await this.mongo.db
                    .collection(this.systemConfig.collections.users)
                    .find(usersQuery, {
                        projection: {
                            _id: 1,
                            username: 1,
                        },
                    })
                    .toArray();
                const usersData = {};
                for (const user of users) {
                    usersData[user._id.toString()] = user.username;
                }
                for (const item of items) {
                    item.username = usersData[item.userId];
                }
            }
            return rep.code(200).send({
                total,
                items,
                itemsPerPage: moduleConfig.options.itemsPerPage,
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    },
});
