const fs = require("fs-extra");
const path = require("path");

/* eslint-disable no-console */
const {
    MongoClient
} = require("mongodb");
const config = require("../../../../../etc/system");

const locations = {
    "en-us": "GeoLite2-City-Locations-en.csv",
    "ru-ru": "GeoLite2-City-Locations-ru.csv",
};

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
    const geoLocations = {};
    try {
        const [
            mongoClient,
            db,
        ] = await connectDatabase(config.mongo.dbName);
        for (const id of Object.keys(locations)) {
            const blocks = fs.readFileSync(path.resolve(__dirname, locations[id]), "utf8");
            for (const line of blocks.split(/\n/)) {
                const [geonameId, , continentCode, , countryCode, , , , , , city] = line.split(/,/);
                if (!geonameId || geonameId === "geoname_id") {
                    continue;
                }
                const data = geoLocations[String(geonameId)] || {};
                data.continent = continentCode;
                data.country = countryCode;
                const defaultCity = data && data["en-us"] ? data["en-us"].city || null : null;
                data[id] = {
                    city: city.replace(/"/gm, "") || defaultCity,
                };
                geoLocations[String(geonameId)] = data;
            }
        }
        for (const k of Object.keys(geoLocations)) {
            await db.collection("geoLocations").insertOne({
                _id: k,
                ...geoLocations[k],
            });
        }
        mongoClient.close();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
