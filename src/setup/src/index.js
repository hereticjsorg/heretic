import fs from "fs-extra";
import path from "path";
import {
    MongoClient
} from "mongodb";
import {
    format
} from "date-fns";

import routesData from "../../build/routes.json";

// eslint-disable-next-line no-console
const log = (message, error = false) => console[error ? "error" : "log"](`[${error ? "!" : " "}] ${format(new Date(), "yyyy-MM-dd HH:mm:ss")} ${message}`);

(async () => {
    try {
        log("Reading configuration files...");
        const config = {
            system: await fs.readJSON(path.resolve(__dirname, "../etc/system.json")),
            website: await fs.readJSON(path.resolve(__dirname, "../etc/website.json")),
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
                const setup = new Setup(config, db);
                await setup.process();
            } else {
                log(`No installation script for page "${page}" loaded`);
            }
        }
        for (const page of routesData.directories.pagesCore) {
            // log(page);
        }
        for (const module of routesData.directories.modules) {
            // log(module);
        }
        log("Disconnecting from the database...");
        mongoClient.close();
        log("All done.");
    } catch (e) {
        log(e.message, true);
        process.exit(1);
    }
})();
