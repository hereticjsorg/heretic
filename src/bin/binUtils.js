const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const {
    v4: uuidv4,
} = require("uuid");
const {
    MongoClient,
} = require("mongodb");
const {
    format,
} = require("date-fns");
const Color = require("../core/lib/color");
const filesData = require("./files.json");
const directoriesData = require("./directories.json");
const cleanupData = require("./cleanup.json");

module.exports = class {
    constructor(options) {
        this.options = options;
        this.languages = Object.keys(fs.readJSONSync(fs.existsSync(path.resolve(__dirname, "../config/languages")) ? path.resolve(__dirname, "../config/languages.json") : path.resolve(__dirname, "../core/defaults/languages.json")));
        this.color = new Color();
        this.logEnabled = true;
        this.logColor = true;
        this.logNoDate = false;
    }

    setOptions(options) {
        this.options = options;
    }

    setLogProperties(properties = {
        enabled: true,
        color: true,
        noDate: false,
    }) {
        this.logEnabled = properties.enabled;
        this.logColor = properties.color;
        this.logNoDate = properties.noDate;
    }

    log(message, options = {}) {
        if (!this.logEnabled) {
            return;
        }
        const currentDateTime = format(new Date(), "yyyy-MM-dd HH:mm:ss");
        if (!this.logColor) {
            let status = " ";
            if (options.error) {
                status = " [ ERROR ] ";
            } else if (options.warning) {
                status = " [ WARNING ] ";
            }
            if (options.noDate || this.logNoDate) {
                // eslint-disable-next-line no-console
                console.log(`${status}${message}`);
            } else {
                // eslint-disable-next-line no-console
                console.log(`${currentDateTime}${status}${message}`);
            }
            return;
        }

        // const text = this.color.get(currentDateTime, ["black", "bgWhite"]);
        let text;
        if (options.header) {
            text = this.color.get(message, ["cyan"]);
        } else if (options.error) {
            text = this.color.get(message, ["red"]);
        } else if (options.warning) {
            text = this.color.get(message, ["yellow"]);
        } else if (options.success) {
            text = this.color.get(message, ["green"]);
        } else {
            text = message;
        }
        if (options.noDate || this.logNoDate) {
            // eslint-disable-next-line no-console
            console.log(text);
        } else {
            // eslint-disable-next-line no-console
            console.log(`${this.color.get(` ${currentDateTime} `, ["black", "bgWhite"])} ${text}`);
        }
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
        this.log("Ensuring directories...", {
            header: true,
        });
        for (const item of directoriesData) {
            this.log(`Ensuring directory: "${item.replace(/\.\.\//gm, "")}...`);
            fs.ensureDirSync(path.resolve(__dirname, item));
        }
    }

    copyFiles() {
        this.log("Copying files...", {
            header: true,
        });
        for (const item of filesData) {
            const to = path.resolve(__dirname, item.to);
            if (fs.existsSync(to) && !this.options.force) {
                this.log(`Skipping: "${item.to.replace(/\.\.\//gm, "")}"`, {
                    warning: true,
                });
                continue;
            }
            const from = path.resolve(__dirname, item.from);
            this.log(`Copying: "${item.to.replace(/\.\.\//gm, "")}...`);
            fs.copySync(from, to);
        }
    }

    generateSecureConfig() {
        const configPath = path.resolve(__dirname, "../../etc/secure.json");
        if (fs.existsSync(configPath) && !this.options.force) {
            this.log(`Skipping: "etc/secure.json"`, {
                warning: true,
            });
            return;
        }
        this.log(`Writing "etc/secure.json"...`, {
            header: true,
        });
        fs.writeJSONSync(configPath, {
            secret: crypto.createHmac("sha256", uuidv4()).update(uuidv4()).digest("hex"),
        }, {
            spaces: "\t",
        });
    }

    writeNavigationConfig() {
        const configDest = path.resolve(__dirname, "../config/navigation.json");
        if (fs.existsSync(configDest)) {
            this.log(`Skipping: "config/navigation.json"`, {
                warning: true,
            });
            return;
        }
        const configNavigation = fs.readJSONSync(path.resolve(__dirname, "../core/defaults/navigation.json"));
        if (!fs.existsSync(path.resolve(__dirname, "../pages/home")) || !fs.existsSync(path.resolve(__dirname, "../pages/license"))) {
            configNavigation.routes = [];
        }
        this.log(`Writing "config/navigation.json"...`, {
            header: true,
        });
        fs.writeJSONSync(configDest, configNavigation, {
            spaces: "\t"
        });
    }

    writeUserTranslationData() {
        for (const lang of this.languages) {
            const filePath = path.resolve(__dirname, `../translations/user/${lang}.json`);
            if (fs.existsSync(filePath)) {
                this.log(`Skipping: "translations/user/${lang}.json"`, {
                    warning: true,
                });
                continue;
            }
            this.log(`Writing "translations/user/${lang}.json"...`, {
                header: true,
            });
            fs.writeJSONSync(filePath, {}, {
                spaces: "\t"
            });
        }
    }

    cleanUp() {
        this.log("Cleaning up...", {
            header: true,
        });
        for (const item of cleanupData) {
            this.log(`Removing "${item.replace(/\.\.\//gm, "")}"...`);
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
        this.log(`Creating or updating "admin" user...`, {
            header: true,
        });
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
        if (resultUser.ok && resultGroup.ok) {
            this.log(`User "admin" has been created/updated in the database`);
        } else {
            this.log(`Could not create or update "admin" user`, {
                warning: true,
            });
        }
    }

    async resetPassword(username) {
        if (!this.db) {
            await this.connectDatabase();
        }
        this.log(`Creating or updating "${username}" user...`, {
            header: true,
        });
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
        if (resultUser.ok) {
            this.log(`User "${username}" has been created/updated in the database`);
        } else {
            this.log(`Could not create or update "${username}" user`, {
                warning: true,
            });
        }
    }

    addPage(id, addNavigationConfig = false) {
        this.log(`Creating page: "${id}"...`, {
            header: true,
        });
        if (!id || !id.match(/^[a-z0-9_-]+$/i)) {
            this.log("Invalid page ID, use latin characters, numbers and '-', '_' chars only", {
                warning: true,
            });
            return;
        }
        if (fs.existsSync(path.resolve(__dirname, `../pages/${id}`))) {
            this.log(`Page "${id}" already exists`, {
                warning: true,
            });
            return;
        }
        fs.copySync(path.resolve(__dirname, "../pages/.blank"), path.resolve(__dirname, `../pages/${id}`));
        const pageMetaPath = path.resolve(__dirname, `../pages/${id}/meta.json`);
        const pageMeta = fs.readJSONSync(pageMetaPath);
        pageMeta.id = id;
        fs.writeJSONSync(pageMetaPath, pageMeta, {
            spaces: "\t",
        });
        if (addNavigationConfig) {
            const navJSONPath = path.resolve(__dirname, "../config/navigation.json");
            const navJSON = fs.readJSONSync(navJSONPath);
            if (navJSON.userspace.routes.indexOf(id) === -1) {
                this.log(`Adding navbar item: ${id}...`);
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
        this.log(`Removing page: ${id}...`, {
            header: true,
        });
        if (!id || !id.match(/^[a-z0-9_-]+$/i)) {
            this.log("Invalid page ID, use latin characters, numbers and '-', '_' chars only");
            return;
        }
        const pagePath = path.resolve(__dirname, "..", "pages", id);
        if (!fs.existsSync(pagePath)) {
            this.log(`Page '${id}' doesn't exists`, {
                warning: true,
            });
            return;
        }
        fs.removeSync(pagePath);
        const navJSONPath = path.resolve(__dirname, "../config/navigation.json");
        const navJSON = fs.readJSONSync(navJSONPath);
        if (navJSON.userspace.routes.indexOf(id) >= 0) {
            this.log("Removing page from navbar...");
            navJSON.userspace.routes = navJSON.userspace.routes.filter(r => r !== id);
            navJSON.userspace.home = navJSON.home === id ? "" : navJSON.home;
            fs.writeJSONSync(navJSONPath, navJSON, {
                spaces: "\t",
            });
        }
    }

    addLanguage(id, name) {
        this.log(`Adding language: "${id}" ("${name}")...`, {
            header: true,
        });
        if (!id || !name || !id.match(/^[a-z]{2}-[a-z]{2}$/i)) {
            this.log("Invalid language ID or name", {
                warning: true,
            });
            return;
        }
        const languageJSONPath = path.resolve(__dirname, "../config/languages.json");
        const languageJSON = fs.readJSONSync(languageJSONPath);
        if (Object.keys(languageJSON).indexOf(id) >= 0) {
            this.log(`Language '${id}' already exists`, {
                warning: true,
            });
            return;
        }
        this.log(`Adding new language to languages.json...`);
        languageJSON[id] = name;
        fs.writeJSONSync(languageJSONPath, languageJSON, {
            spaces: "\t",
        });
        this.log(`Modifying etc/meta.json...`);
        const mainMetaJSONPath = path.resolve(__dirname, "../../etc/meta.json");
        const mainMetaJSON = fs.readJSONSync(mainMetaJSONPath);
        mainMetaJSON.title[id] = "";
        mainMetaJSON.shortTitle[id] = "";
        mainMetaJSON.description[id] = "";
        fs.writeJSONSync(mainMetaJSONPath, mainMetaJSON, {
            spaces: "\t",
        });
        this.log("Modifying existing pages...");
        for (const area of ["../pages", "../core/pages"]) {
            for (const p of fs.readdirSync(path.resolve(__dirname, area)).filter(page => !page.match(/^\./))) {
                const pageConfigPath = path.resolve(__dirname, area, `${p}/page.js`);
                let directories = [""];
                if (fs.existsSync(pageConfigPath)) {
                    const pageConfig = require(pageConfigPath);
                    if (Array.isArray(pageConfig)) {
                        directories = pageConfig;
                    } else {
                        directories = [""];
                    }
                }
                for (const dir of directories) {
                    const pageUserspaceJSONPath = path.resolve(__dirname, area, dir, p, "meta.json");
                    if (fs.existsSync(pageUserspaceJSONPath)) {
                        const pageJSON = fs.readJSONSync(pageUserspaceJSONPath);
                        if (pageJSON.userspace) {
                            pageJSON.userspace.title[id] = pageJSON.userspace.title[id] || "";
                            if (pageJSON.userspace.description) {
                                pageJSON.userspace.description[id] = pageJSON.userspace.description[id] || "";
                            }
                        }
                        if (pageJSON.admin) {
                            pageJSON.admin.title[id] = pageJSON.admin.title[id] || "";
                            if (pageJSON.admin.description) {
                                pageJSON.admin.description[id] = pageJSON.admin.description[id] || "";
                            }
                        }
                        fs.writeJSONSync(pageUserspaceJSONPath, pageJSON, {
                            spaces: "\t",
                        });
                    }
                    if (fs.existsSync(path.resolve(__dirname, area, dir, `${p}/userspace/content/lang-switch`))) {
                        fs.ensureDirSync(path.resolve(__dirname, area, dir, `${p}/userspace/content/lang-${id}`));
                        fs.writeFileSync(path.resolve(__dirname, area, dir, `${p}/userspace/content/lang-${id}/index.marko`), `<div>${name}</div>`, "utf8");
                    }
                }
            }
        }
        this.log("Modifying existing modules...");
        for (const m of fs.readdirSync(path.resolve(__dirname, "../modules")).filter(page => !page.match(/^\./))) {
            const moduleConfig = require(path.resolve(__dirname, `../modules/${m}/module.js`));
            const directories = Object.keys(moduleConfig.routes);
            for (const dir of directories) {
                const moduleMetaJSONPath = path.resolve(__dirname, `../modules/${m}/${dir}/meta.json`);
                if (fs.existsSync(moduleMetaJSONPath)) {
                    const moduleJSON = fs.readJSONSync(moduleMetaJSONPath);
                    moduleJSON.title[id] = moduleJSON.title[id] || "";
                    if (moduleJSON.description) {
                        moduleJSON.description[id] = moduleJSON.description[id] || "";
                    }
                    fs.writeJSONSync(moduleMetaJSONPath, moduleJSON, {
                        spaces: "\t",
                    });
                }
            }
        }
        this.log("Modifying core translation files...");
        const transCoreJSON = fs.readJSONSync(path.resolve(__dirname, `../translations/core/${Object.keys(languageJSON)[0]}.json`));
        fs.writeJSONSync(path.resolve(__dirname, `../translations/core/${id}.json`), transCoreJSON, {
            spaces: "\t"
        });
        if (fs.existsSync(path.resolve(__dirname, "../translations/user"))) {
            this.log("Modifying user translation files...");
            const transUserJSON = fs.readJSONSync(path.resolve(__dirname, `../translations/user/${Object.keys(languageJSON)[0]}.json`));
            fs.writeJSONSync(path.resolve(__dirname, `../translations/user/${id}.json`), transUserJSON, {
                spaces: "\t"
            });
        }
    }

    removeLanguage(id) {
        this.log(`Removing language: "${id}"...`, {
            header: true,
        });
        if (!id || !id.match(/^[a-z]{2}-[a-z]{2}$/i)) {
            this.log("Invalid language ID", {
                warning: true,
            });
            return;
        }
        const languageJSONPath = path.resolve(__dirname, "../config/languages.json");
        const languageJSON = fs.readJSONSync(languageJSONPath);
        delete languageJSON[id];
        fs.writeJSONSync(languageJSONPath, languageJSON, {
            spaces: "\t",
        });
        this.log(`Modifying etc/meta.json...`);
        const mainMetaJSONPath = path.resolve(__dirname, "../../etc/meta.json");
        const mainMetaJSON = fs.readJSONSync(mainMetaJSONPath);
        delete mainMetaJSON.title[id];
        delete mainMetaJSON.shortTitle[id];
        delete mainMetaJSON.description[id];
        fs.writeJSONSync(mainMetaJSONPath, mainMetaJSON, {
            spaces: "\t",
        });
        this.log("Modifying existing pages...");
        for (const area of ["../pages", "../core/pages"]) {
            for (const p of fs.readdirSync(path.resolve(__dirname, area)).filter(page => !page.match(/^\./))) {
                const pageConfigPath = path.resolve(__dirname, area, `${p}/page.js`);
                let directories = [""];
                if (fs.existsSync(pageConfigPath)) {
                    const pageConfig = require(pageConfigPath);
                    if (Array.isArray(pageConfig)) {
                        directories = pageConfig;
                    } else {
                        directories = [""];
                    }
                }
                for (const dir of directories) {
                    const pageUserspaceJSONPath = path.resolve(__dirname, area, dir, p, "meta.json");
                    if (fs.existsSync(pageUserspaceJSONPath)) {
                        const pageJSON = fs.readJSONSync(pageUserspaceJSONPath);
                        if (pageJSON.userspace) {
                            delete pageJSON.userspace.title[id];
                            if (pageJSON.userspace.description) {
                                delete pageJSON.userspace.description[id];
                            }
                        }
                        if (pageJSON.admin) {
                            delete pageJSON.admin.title[id];
                            if (pageJSON.admin.description) {
                                delete pageJSON.admin.description[id];
                            }
                        }
                        fs.writeJSONSync(pageUserspaceJSONPath, pageJSON, {
                            spaces: "\t",
                        });
                    }
                    if (fs.existsSync(path.resolve(__dirname, area, dir, `${p}/userspace/content/lang-${id}`))) {
                        fs.removeSync(path.resolve(__dirname, area, dir, `${p}/userspace/content/lang-${id}`));
                    }
                }
            }
        }
        this.log("Modifying existing modules...");
        for (const m of fs.readdirSync(path.resolve(__dirname, "../modules")).filter(page => !page.match(/^\./))) {
            const moduleConfig = require(path.resolve(__dirname, `../modules/${m}/module.js`));
            const directories = Object.keys(moduleConfig.routes);
            for (const dir of directories) {
                const moduleMetaJSONPath = path.resolve(__dirname, `../modules/${m}/${dir}/meta.json`);
                if (fs.existsSync(moduleMetaJSONPath)) {
                    const moduleJSON = fs.readJSONSync(moduleMetaJSONPath);
                    delete moduleJSON.title[id];
                    if (moduleJSON.description) {
                        delete moduleJSON.description[id];
                    }
                    fs.writeJSONSync(moduleMetaJSONPath, moduleJSON, {
                        spaces: "\t",
                    });
                }
            }
        }
        this.log("Modifying core translation files...");
        const coreLangPath = path.resolve(__dirname, `../translations/core/${id}.json`);
        if (fs.existsSync(coreLangPath)) {
            fs.removeSync(coreLangPath);
        }
        const userLangPath = path.resolve(__dirname, `../translations/user/${id}.json`);
        if (fs.existsSync(userLangPath)) {
            fs.removeSync(userLangPath);
        }
    }

    initCorePagesMeta() {
        fs.readdirSync(path.resolve(__dirname, "../core/pages")).filter(p => !p.match(/^\./)).map(p => {
            const metaPath = path.resolve(__dirname, `../core/pages/${p}/meta.json`);
            const metaDistPath = path.resolve(__dirname, `../core/pages/${p}/meta-dist.json`);
            if (!fs.existsSync(metaPath) && fs.existsSync(metaDistPath)) {
                fs.copySync(metaDistPath, metaPath);
            }
        });
    }

    printLogo() {
        // eslint-disable-next-line no-console
        console.log(`${this.color.get("                 ", ["bgGreen"])}\n${this.color.get("  H E R E T I C  ", ["bgGreen", "whiteBright"])}\n${this.color.get("                 ", ["bgGreen"])}\n`);
    }
};