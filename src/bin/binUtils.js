/* eslint-disable no-console */

const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const {
    v4: uuidv4,
} = require("uuid");
const {
    MongoClient,
} = require("mongodb");
const filesData = require("./files.json");
const directoriesData = require("./directories.json");
const cleanupData = require("./cleanup.json");

module.exports = class {
    constructor(options) {
        this.options = options;
        this.languages = Object.keys(fs.readJSONSync(fs.existsSync(path.resolve(__dirname, "../config/languages")) ? path.resolve(__dirname, "../config/languages.json") : path.resolve(__dirname, "../core/defaults/languages.json")));
    }

    readConfig() {
        this.config = require(path.resolve(`${__dirname}/../../etc/system.js`));
    }

    async connectDatabase() {
        this.mongoClient = new MongoClient(this.config.mongo.url, this.config.mongo.options || {
            useUnifiedTopology: true,
            connectTimeoutMS: 5000,
            keepAlive: true,
            useNewUrlParser: true
        });
        await this.mongoClient.connect();
        this.db = this.mongoClient.db(this.config.mongo.dbName);
    }

    disconnectDatabase() {
        if (this.db) {
            this.mongoClient.close();
        }
    }

    ensureDirectories() {
        for (const item of directoriesData) {
            console.log(`Ensuring directory: "${item.replace(/\.\.\//gm, "")}...`);
            fs.ensureDirSync(path.resolve(__dirname, item));
        }
    }

    copyFiles() {
        for (const item of filesData) {
            const to = path.resolve(__dirname, item.to);
            if (fs.existsSync(to) && !this.options.force) {
                console.log(`Skipping: "${item.to.replace(/\.\.\//gm, "")}"`);
                continue;
            }
            const from = path.resolve(__dirname, item.from);
            console.log(`Copying: "${item.to.replace(/\.\.\//gm, "")}...`);
            fs.copySync(from, to);
        }
    }

    generateSecureConfig() {
        const configPath = path.resolve(__dirname, "../../etc/secure.json");
        if (fs.existsSync(configPath) && !this.options.force) {
            console.log(`Skipping: "etc/secure.json"`);
            return;
        }
        console.log(`Writing "etc/secure.json"...`);
        fs.writeJSONSync(configPath, {
            secret: crypto.createHmac("sha256", uuidv4()).update(uuidv4()).digest("hex"),
        }, {
            spaces: "\t",
        });
    }

    writeNavigationConfig() {
        const configDest = path.resolve(__dirname, "../config/navigation.json");
        if (fs.existsSync(configDest)) {
            console.log(`Skipping: "config/navigation.json"`);
            return;
        }
        const configNavigation = fs.readJSONSync(path.resolve(__dirname, "../core/defaults/navigation.json"));
        if (!fs.existsSync(path.resolve(__dirname, "../pages/home")) || !fs.existsSync(path.resolve(__dirname, "../pages/license"))) {
            configNavigation.routes = [];
        }
        console.log(`Writing "config/navigation.json"...`);
        fs.writeJSONSync(configDest, configNavigation, {
            spaces: "\t"
        });
    }

    writeUserTranslationData() {
        for (const lang of this.languages) {
            const filePath = path.resolve(__dirname, `../translations/user/${lang}.json`);
            if (fs.existsSync(filePath)) {
                console.log(`Skipping: "translations/user/${lang}.json"`);
                continue;
            }
            console.log(`Writing "translations/user/${lang}.json"...`);
            fs.writeJSONSync(filePath, {}, {
                spaces: "\t"
            });
        }
    }

    cleanUp() {
        for (const item of cleanupData) {
            console.log(`Removing "${item.replace(/\.\.\//gm, "")}"...`);
            fs.removeSync(path.resolve(__dirname, item));
        }
    }

    async createHash(data) {
        return new Promise((resolve, reject) => {
            const salt = crypto.randomBytes(8).toString("hex");
            crypto.scrypt(data, salt, 64, (err, derivedKey) => {
                if (err) {
                    reject(err);
                }
                resolve(`${salt }:${derivedKey.toString("hex")}`);
            });
        });
    }

    async createAdmin() {
        if (!this.db) {
            await this.connectDatabase();
        }
        const password = await this.createHash(`password${this.config.secret}`);
        const resultUser = await this.db.collection(this.config.collections.users).findOneAndUpdate({
            username: "admin",
        }, {
            $set: {
                username: "admin",
                password,
                groups: ["admin"],
            },
        }, {
            upsert: true,
        });
        const resultGroup = await this.db.collection(this.config.collections.groups).findOneAndUpdate({
            group: "admin",
        }, {
            $set: {
                group: "admin",
                data: [{
                    uid: uuidv4(),
                    id: "admin",
                    type: "boolean",
                    value: true,
                }]
            },
        }, {
            upsert: true,
        });
        console.log(resultUser.ok && resultGroup.ok ? `User "admin" has been created/updated in the database` : `Could not create or update "admin" user`);
        this.disconnectDatabase();
    }

    async resetPassword(username) {
        if (!this.db) {
            await this.connectDatabase();
        }
        const password = await this.createHash(`password${this.config.secret}`);
        const resultUser = await this.db.collection(this.config.collections.users).findOneAndUpdate({
            username,
        }, {
            $set: {
                username,
                password,
            },
        }, {
            upsert: true,
        });
        console.log(resultUser.ok ? `User "${username}" has been created/updated in the database` : `Could not create or update "${username}" user`);
        this.disconnectDatabase();
    }

    addPage(id, addNavigationConfig = false) {
        console.log(`Adding page: ${id}...`);
        if (!id || !id.match(/^[a-z0-9_-]+$/i)) {
            console.error("Invalid page ID, use latin characters, numbers and '-', '_' chars only");
            return;
        }
        if (fs.existsSync(path.resolve(__dirname, `../pages/${id}`))) {
            console.error(`Page "${id}" already exists`);
            return;
        }
        console.log(`Creating page: "${id}"...`);
        fs.copySync(path.resolve(__dirname, "../pages/.blank"), path.resolve(__dirname, `../pages/${id}`));
        const pageMetaPath = path.resolve(__dirname, `../pages/${id}/pages.json`);
        const pageMeta = fs.readJSONSync(pageMetaPath);
        pageMeta.id = id;
        pageMeta.path = `/${id}`;
        fs.writeJSONSync(pageMetaPath, pageMeta, {
            spaces: "\t",
        });
        if (addNavigationConfig) {
            const navJSONPath = path.resolve(__dirname, "../config/navigation.json");
            const navJSON = fs.readJSONSync(navJSONPath);
            if (navJSON.userspace.routes.indexOf(id) === -1) {
                console.log(`Adding navbar item: ${id}...`);
                navJSON.userspace.routes.push(id);
                if (!navJSON.userspace.home) {
                    navJSON.userspace.home = id;
                }
                fs.writeJSONSync(navJSONPath, navJSON, {
                    spaces: "\t",
                });
            }
        }
    }

    removePage(id) {
        console.log(`Removing page: ${id}...`);
        if (!id || !id.match(/^[a-z0-9_-]+$/i)) {
            console.error("Invalid page ID, use latin characters, numbers and '-', '_' chars only");
            return;
        }
        const pagePath = path.resolve(__dirname, "..", "pages", id);
        if (!fs.existsSync(pagePath)) {
            console.error(`Page '${id}' doesn't exists`);
            return;
        }
        console.log(`Removing page '${id}...`);
        fs.removeSync(pagePath);
        const navJSONPath = path.resolve(__dirname, "../config/navigation.json");
        const navJSON = fs.readJSONSync(navJSONPath);
        if (navJSON.routes.indexOf(id) >= 0) {
            console.log("Removing page from navbar...");
            navJSON.routes = navJSON.routes.filter(r => r !== id);
            navJSON.home = navJSON.home === id ? "" : navJSON.home;
            fs.writeJSONSync(navJSONPath, navJSON, {
                spaces: "\t",
            });
        }
    }

    addLanguage(id, name) {
        console.log(`Adding language: "${id}" ("${name}")...`);
        if (!id || !name || !id.match(/^[a-z]{2}-[a-z]{2}$/i)) {
            console.error("Invalid language ID or name");
            return;
        }
        const languageJSONPath = path.resolve(__dirname, "../config/languages.json");
        const languageJSON = fs.readJSONSync(languageJSONPath);
        if (Object.keys(languageJSON).indexOf(id) >= 0) {
            console.error(`Language '${id}' already exists`);
            return;
        }
        console.log(`Adding new language to languages.json...`);
        languageJSON[id] = name;
        fs.writeJSONSync(languageJSONPath, languageJSON, {
            spaces: "\t",
        });
        console.log("Modifying existing pages...");
        fs.readdirSync(path.resolve(__dirname, "../pages")).filter(p => !p.match(/^\./)).map(p => {
            const pageUserspaceJSONPath = path.resolve(__dirname, `../pages/${p}/page.json`);
            if (fs.existsSync(pageUserspaceJSONPath)) {
                const pageJSON = fs.readJSONSync(pageUserspaceJSONPath);
                pageJSON.title[id] = pageJSON.title[id] || "";
                pageJSON.description[id] = pageJSON.description[id] || "";
                fs.writeJSONSync(pageUserspaceJSONPath, pageJSON, {
                    spaces: "\t",
                });
            }
            const pageAdminJSONPath = path.resolve(__dirname, `../pages/${p}/meta.json`);
            if (fs.existsSync(pageAdminJSONPath)) {
                const pageJSON = fs.readJSONSync(pageAdminJSONPath);
                pageJSON.title[id] = pageJSON.title[id] || "";
                pageJSON.description[id] = pageJSON.description[id] || "";
                fs.writeJSONSync(pageAdminJSONPath, pageJSON, {
                    spaces: "\t",
                });
            }
            if (fs.existsSync(path.resolve(__dirname, `../pages/${p}/userspace/content/lang-switch`))) {
                fs.ensureDirSync(path.resolve(__dirname, `../pages/${p}/userspace/content/lang-${id}`));
                fs.writeFileSync(path.resolve(__dirname, `../pages/${p}/userspace/content/lang-${id}/index.marko`), `<div>${name}</div>`, "utf8");
            }
        });
        console.log("Modifying core translation files...");
        const transCoreJSON = fs.readJSONSync(path.resolve(__dirname, `../translations/core/${Object.keys(languageJSON)[0]}.json`));
        fs.writeJSONSync(path.resolve(__dirname, `../translations/core/${id}.json`), transCoreJSON, {
            spaces: "\t"
        });
        if (fs.existsSync(path.resolve(__dirname, "../translations/user"))) {
            console.log("Modifying user translation files...");
            const transUserJSON = fs.readJSONSync(path.resolve(__dirname, `../translations/user/${Object.keys(languageJSON)[0]}.json`));
            fs.writeJSONSync(path.resolve(__dirname, `../translations/user/${id}.json`), transUserJSON, {
                spaces: "\t"
            });
        }
    }
};
