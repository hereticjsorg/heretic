const fs = require("fs-extra");
const path = require("path");
const {
    Netmask,
} = require("netmask");

const ip2int = ip => ip.split`.`.reduce((int, value) => int * 256 + +value);

/* eslint-disable no-console */
const {
    MongoClient,
    Long,
} = require("mongodb");
const config = require("../../../../../etc/system");

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
        const blocks = fs.readFileSync(path.resolve(__dirname, "GeoLite2-City-Blocks-IPv4.csv"), "utf8");
        for (const line of blocks.split(/\n/)) {
            const [network, geonameId] = line.split(/,/);
            if (!network || network === "network") {
                continue;
            }
            const block = new Netmask(network);
            const blockFirstInt = ip2int(block.first);
            const blockLastInt = ip2int(block.last);
            await db.collection("geoNetworks").insertOne({
                blockStart: Long(blockFirstInt),
                blockEnd: Long(blockLastInt),
                geoNameId: String(geonameId),
            });
        }
        await db.collection("geoNetworks").createIndex({
            blockStart: 1,
            blockEnd: 1,
        }, {
            name: "geoIndexBlocks",
        });
        mongoClient.close();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
