/* eslint-disable no-console */
const fs = require("fs-extra");
const path = require("path");
const commandLineArgs = require("command-line-args");
const {
    MongoClient
} = require("mongodb");
const crypto = require("crypto");

const config = require(path.resolve(`${__dirname}/../../etc/system.json`));

let options;
try {
    options = commandLineArgs([{
        name: "addModule",
        alias: "a",
        type: String
    }, {
        name: "removeModule",
        alias: "r",
        type: String
    }, {
        name: "addLanguage",
        alias: "t",
        type: String
    }, {
        name: "removeLanguage",
        alias: "d",
        type: String
    }, {
        name: "navigation",
        alias: "n",
        type: Boolean
    }, {
        name: "resetPassword",
        alias: "p",
        type: String
    }]);
} catch (e) {
    console.error(e.message);
    process.exit(1);
}

const connectDatabase = async () => {
    const mongoClient = new MongoClient(config.mongo.url, config.mongo.options || {
        useUnifiedTopology: true,
        connectTimeoutMS: 5000,
        keepAlive: true,
        useNewUrlParser: true
    });
    await mongoClient.connect();
    const db = mongoClient.db(config.mongo.dbName);
    return {
        mongoClient,
        db,
    };
};

const createHash = data => new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(8).toString("hex");
    crypto.scrypt(data, salt, 64, (err, derivedKey) => {
        if (err) {
            reject(err);
        }
        resolve(`${salt }:${derivedKey.toString("hex")}`);
    });
});

const addModuleFunc = (id, navigation) => {
    console.log(`Adding language: ${id}...`);
    if (!id || !id.match(/^[a-z0-9_-]+$/i)) {
        console.error("Invalid module ID, use latin characters, numbers and '-', '_' chars only");
        process.exit(1);
    }
    if (fs.existsSync(path.resolve(__dirname, "..", "modules", id))) {
        console.error(`Module '${id}' already exists`);
        process.exit(1);
    }
    console.log(`Creating module '${id}...`);
    fs.copySync(path.resolve(__dirname, "..", "modules", ".blank"), path.resolve(__dirname, "..", "modules", id));
    const moduleMeta = fs.readJSONSync(path.resolve(__dirname, "..", "modules", id, "module.json"));
    moduleMeta.id = id;
    moduleMeta.path = `/${id}`;
    fs.writeJSONSync(path.resolve(__dirname, "..", "modules", id, "module.json"), moduleMeta, {
        spaces: "\t",
    });
    if (navigation) {
        const navJson = fs.readJSONSync(path.resolve(__dirname, "..", "config", "navigation.json"));
        if (navJson.routes.indexOf(id) === -1) {
            console.log("Adding navbar item...");
            navJson.routes.push(id);
            if (!navJson.home) {
                navJson.home = id;
            }
            fs.writeJSONSync(path.resolve(__dirname, "..", "config", "navigation.json"), navJson, {
                spaces: "\t"
            });
        }
    }
    console.log("All done.\n");
};

const removeModuleFunc = id => {
    console.log(`Removing module: ${id}...`);
    if (!id || !id.match(/^[a-z0-9_-]+$/i)) {
        console.error("Invalid module ID, use latin characters, numbers and '-', '_' chars only");
        process.exit(1);
    }
    if (!fs.existsSync(path.resolve(__dirname, "..", "modules", id))) {
        console.error(`Module '${id}' doesn't exists`);
        process.exit(1);
    }
    console.log(`Removing module '${id}...`);
    fs.removeSync(path.resolve(__dirname, "..", "modules", id));
    const navJson = fs.readJSONSync(path.resolve(__dirname, "..", "config", "navigation.json"));
    if (navJson.routes.indexOf(id) >= 0) {
        console.log("Removing module from navbar...");
        navJson.routes = navJson.routes.filter(r => r !== id);
        navJson.home = navJson.home === id ? "" : navJson.home;
        fs.writeJSONSync(path.resolve(__dirname, "..", "config", "navigation.json"), navJson, {
            spaces: "\t"
        });
    }
    console.log("All done.\n");
};

const addLanguageFunc = data => {
    const [id, name] = data.split(/:/);
    console.log(`Adding language: ${id} (${name})...`);
    if (!id || !id.match(/^[a-z]{2}-[a-z]{2}$/i)) {
        console.error("Invalid language ID, use the following format: xx-xx");
        process.exit(1);
    }
    if (!name) {
        console.error("Please specify language ID and name, example: de-de:Deutsch");
        process.exit(1);
    }
    const languageJson = fs.readJSONSync(path.resolve(__dirname, "..", "config", "languages.json"));
    if (Object.keys(languageJson).indexOf(id) >= 0) {
        console.error(`Language '${id}' already exists`);
        process.exit(1);
    }
    console.log(`Adding new language to languages.json: ${id} (${name})...`);
    languageJson[id] = name;
    fs.writeJSONSync(path.resolve(__dirname, "..", "config", "languages.json"), languageJson, {
        spaces: "\t"
    });
    console.log("Modifying existing modules...");
    fs.readdirSync(path.resolve(__dirname, "..", "pamodulesges")).map(p => {
        const metaJson = fs.readJSONSync(path.resolve(__dirname, "..", "modules", p, "module.json"));
        metaJson.title[id] = metaJson.title[id] || "";
        metaJson.description[id] = metaJson.description[id] || "";
        fs.writeJSONSync(path.resolve(__dirname, "..", "modules", p, "module.json"), metaJson, {
            spaces: "\t"
        });
        fs.ensureDirSync(path.resolve(__dirname, "..", "modules", p, "content", `lang-${id}`));
        fs.writeFileSync(path.resolve(__dirname, "..", "modules", p, "content", `lang-${id}`, "index.marko"), `<div>${name}</div>`, "utf8");
    });
    const metaJson = fs.readJSONSync(path.resolve(__dirname, "..", "..", "etc", "module.json"));
    metaJson.title[id] = metaJson.title[id] || "";
    metaJson.shortTitle[id] = metaJson.shortTitle[id] || "";
    metaJson.description[id] = metaJson.description[id] || "";
    fs.writeJSONSync(path.resolve(__dirname, "..", "..", "etc", "module.json"), metaJson, {
        spaces: "\t"
    });
    const transCoreJson = fs.readJSONSync(path.resolve(__dirname, "..", "translations", "core", `${Object.keys(languageJson)[0]}.json`));
    fs.writeJSONSync(path.resolve(__dirname, "..", "translations", "core", `${id}.json`), transCoreJson, {
        spaces: "\t"
    });
    if (fs.existsSync(path.resolve(__dirname, "..", "translations", "user"))) {
        const transUserJson = fs.readJSONSync(path.resolve(__dirname, "..", "translations", "user", `${Object.keys(languageJson)[0]}.json`));
        fs.writeJSONSync(path.resolve(__dirname, "..", "translations", "user", `${id}.json`), transUserJson, {
            spaces: "\t"
        });
    }
    console.log("All done.\n");
};

const removeLanguageFunc = id => {
    console.log(`Removing language: ${id}...`);
    if (!id || !id.match(/^[a-z]{2}-[a-z]{2}$/i)) {
        console.error("Invalid language ID, use the following format: xx-xx");
        process.exit(1);
    }
    const languageJson = fs.readJSONSync(path.resolve(__dirname, "..", "config", "languages.json"));
    if (Object.keys(languageJson).indexOf(id) === -1) {
        console.error(`Language '${id}' doesn't exists`);
        process.exit(1);
    }
    console.log(`Removing language from languages.json: ${id}...`);
    delete languageJson[id];
    fs.writeJSONSync(path.resolve(__dirname, "..", "config", "languages.json"), languageJson, {
        spaces: "\t"
    });
    console.log("Removing language from existing modules...");
    fs.readdirSync(path.resolve(__dirname, "..", "modules")).map(p => {
        const metaJson = fs.readJSONSync(path.resolve(__dirname, "..", "modules", p, "module.json"));
        delete metaJson.title[id];
        delete metaJson.description[id];
        fs.writeJSONSync(path.resolve(__dirname, "..", "modules", p, "module.json"), metaJson, {
            spaces: "\t"
        });
        if (fs.existsSync(path.resolve(__dirname, "..", "modules", p, "content", `lang-${id}`))) {
            fs.removeSync(path.resolve(__dirname, "..", "modules", p, "content", `lang-${id}`));
        }
    });
    const metaJson = fs.readJSONSync(path.resolve(__dirname, "..", "..", "etc", "module.json"));
    delete metaJson.title[id];
    delete metaJson.shortTitle[id];
    delete metaJson.description[id];
    fs.writeJSONSync(path.resolve(__dirname, "..", "..", "etc", "module.json"), metaJson, {
        spaces: "\t"
    });
    if (fs.existsSync(path.resolve(__dirname, "..", "translations", "core", `${id}.json`))) {
        fs.removeSync(path.resolve(__dirname, "..", "translations", "core", `${id}.json`));
    }
    if (fs.existsSync(path.resolve(__dirname, "..", "translations", "user", `${id}.json`))) {
        fs.removeSync(path.resolve(__dirname, "..", "translations", "user", `${id}.json`));
    }
    console.log("All done.\n");
};

const resetPasswordFunc = async username => {
    console.log(`Creating user/updating password for "${username}"...`);
    try {
        const {
            mongoClient,
            db
        } = await connectDatabase();
        const password = await createHash(`password${config.secret}`);
        const result = await db.collection(config.collections.users).findOneAndUpdate({
            username,
        }, {
            $set: {
                password,
            },
        }, {
            upsert: true,
        });
        mongoClient.close();
        console.log(result.ok ? "All done." : "Could not update database record");
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
};

if (!Object.keys(options).length) {
    console.log(`Usage:\n\nnpm run cli -- --addModule <id> [--navigation] - create a new module (optionally add to navbar)
               --removeModule <id> - delete existing module
               --addLanguage <id:name> - add new language (example: de-de:Deutsch)
               --removeLanguage <id> - delete existing language
               --resetPassword <username> - create user or reset password to "password"\n`);
    process.exit(0);
}

if (options.addModule !== undefined) {
    addModuleFunc(options.addModule, !!options.navigation);
}

if (options.removeModule !== undefined) {
    removeModuleFunc(options.removeModule);
}

if (options.addLanguage !== undefined) {
    addLanguageFunc(options.addLanguage);
}

if (options.removeLanguage !== undefined) {
    removeLanguageFunc(options.removeLanguage);
}

if (options.resetPassword !== undefined) {
    resetPasswordFunc(options.resetPassword);
}
