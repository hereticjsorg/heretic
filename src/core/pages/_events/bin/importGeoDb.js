/* eslint-disable no-console */
const {
    MongoClient,
} = require("mongodb");
const config = require("../../../../../etc/system.js");

// const geoLocationsData = require("../data/geoLocations.json");
const geoNetworksData = require("../data/geoNetworks.json");

const connectDatabase = async dbName => {
    const mongoClient = new MongoClient(config.mongo.url, config.mongo.options);
    await mongoClient.connect();
    const db = mongoClient.db(dbName || config.mongo.dbName);
    return [
        mongoClient,
        db,
    ];
};

(async () => {
    try {
        const [
            mongoClient,
            db,
        ] = await connectDatabase(config.mongo.dbName);
        // for (const k of Object.keys(geoLocationsData)) {
        //     const item = geoLocationsData[k];
        //     await db.collection("geoLocations").updateOne({
        //         ...item,
        //         _id: k,
        //     }, {
        //         $set: item,
        //     }, {
        //         upsert: true,
        //     });
        // }
        for (const item of geoNetworksData) {
            await db.collection("geoNetworks").updateOne({
                _id: item._id,
            }, {
                $set: {
                    ...item,
                    ipf: Number(item.ipf),
                    ipt: Number(item.ipt),
                },
            }, {
                upsert: true,
            });
        }
        try {
            await db.collection("geoNetworks").dropIndex("geo_IndexIp");
        } catch {
            // Ignore
        }
        await db.collection("geoNetworks").createIndex({
            from: 1,
            to: 1,
        }, {
            name: "geo_IndexIp",
        });
        mongoClient.close();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
