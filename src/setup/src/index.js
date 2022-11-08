import path from "path";
import {
    MongoClient
} from "mongodb";
import {
    format
} from "date-fns";

import routesData from "../../build/build.json";

// eslint-disable-next-line no-console
const log = (message, error = false) => console[error ? "error" : "log"](`[${error ? "!" : " "}] ${format(new Date(), "yyyy-MM-dd HH:mm:ss")} ${message}`);

const createIndex = async (db, id, collection, fields, direction = "asc") => {
    const indexCreate = {};
    fields.map(i => indexCreate[i] = direction === "asc" ? 1 : -1);
    log(`Dropping "${id}_${collection}_${direction}" index...`);
    try {
        await db.collection(collection).dropIndex(`${id}_${collection}_${direction}`);
    } catch {
        // Ignore
    }
    log(`Creating "${id}_${collection}_${direction}" index...`);
    try {
        await db.collection(collection).createIndex(indexCreate, {
            name: `${id}_${collection}_${direction}`
        });
    } catch {
        // Ignore
    }
};

const createExpireIndex = async (db, id, collection, field, seconds) => {
    const indexExpire = {};
    indexExpire[field] = 1;
    log(`Dropping "${id}_${collection}_expire" index...`);
    try {
        await db.collection(collection).dropIndex(`${id}_${collection}_expire}`);
    } catch {
        // Ignore
    }
    log(`Creating "${id}_${collection}_expire" index...`);
    try {
        await db.collection(collection).createIndex(indexExpire, {
            expireAfterSeconds: parseInt(seconds, 10),
            name: `${id}_${collection}_expire`
        });
    } catch {
        // Ignore
    }
};

(async () => {
    try {
        log("Reading configuration files...");
        const config = {
            // eslint-disable-next-line no-undef
            system: __non_webpack_require__(path.resolve(__dirname, "../etc/system.js")),
            // eslint-disable-next-line no-undef
            website: __non_webpack_require__(path.resolve(__dirname, "../etc/website.js")),
        };
        const mongoClient = new MongoClient(config.system.mongo.url, config.system.mongo.options || {
            useUnifiedTopology: true,
            connectTimeoutMS: 5000,
            keepAlive: true,
            useNewUrlParser: true
        });
        mongoClient.on("serverDescriptionChanged", e => {
            if (e && e.newDescription && e.newDescription.error) {
                log("Fatal: connection to MongoDB is broken", true);
                process.exit(1);
            }
        });
        log("Connecting to the database...");
        await mongoClient.connect();
        const db = mongoClient.db(config.system.mongo.dbName);
        for (const page of routesData.directories.pages) {
            let Setup;
            try {
                Setup = (await import(`../../pages/${page}/setup.js`)).default;
            } catch {
                // Ignore
            }
            if (Setup) {
                log(`Executing installation script for page: ${page}...`);
                const setup = new Setup(page, config, db, {
                    log,
                    createIndex,
                    createExpireIndex,
                });
                await setup.process();
            } else {
                log(`No installation script for page "${page}" loaded`);
            }
        }
        for (const page of routesData.directories.pagesCore) {
            let Setup;
            try {
                Setup = (await import(`../../core/pages/${page}/setup.js`)).default;
            } catch {
                // Ignore
            }
            if (Setup) {
                log(`Executing installation script for core page: ${page}...`);
                const setup = new Setup(page, config, db, {
                    log,
                    createIndex,
                    createExpireIndex,
                });
                await setup.process();
            } else {
                log(`No installation script for core page "${page}" loaded`);
            }
        }
        for (const module of routesData.directories.modules) {
            let Setup;
            try {
                Setup = (await import(`../../modules/${module}/setup.js`)).default;
            } catch {
                // Ignore
            }
            if (Setup) {
                log(`Executing installation script for module: ${module}...`);
                const setup = new Setup(module, config, db, {
                    log,
                    createIndex,
                    createExpireIndex,
                });
                await setup.process();
            } else {
                log(`No installation script for module "${module}" loaded`);
            }
        }
        log("Disconnecting from the database...");
        mongoClient.close();
        log("All done.");
    } catch (e) {
        log(e.message, true);
        process.exit(1);
    }
})();
