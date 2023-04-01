import {
    ObjectId
} from "mongodb";

export default () => ({
    async handler(req, rep) {
        try {
            const {
                id,
            } = req.body;
            if (!id || typeof id !== "string" || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)) {
                return rep.error({
                    message: "Invalid ID",
                });
            }
            const activationDb = await this.mongo.db.collection(this.systemConfig.collections.activation).findOne({
                _id: id,
            });
            if (!activationDb) {
                return rep.error({
                    message: "Invalid ID",
                });
            }
            switch (activationDb.type) {
            case "email":
                await this.mongo.db.collection(this.systemConfig.collections.users).updateOne({
                    _id: new ObjectId(activationDb.userId),
                }, {
                    $set: {
                        email: activationDb.value,
                    },
                });
                break;
            }
            await this.mongo.db.collection(this.systemConfig.collections.activation).deleteOne({
                _id: id,
            });
            return rep.success({
                type: activationDb.type,
                value: activationDb.value,
            });
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
