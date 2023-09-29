const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const cliProgress = require("cli-progress");
const zlib = require("zlib");
const argon2 = require("argon2");
const {
    spawn,
} = require("node:child_process");
const {
    v4: uuidv4,
} = require("uuid");
const {
    MongoClient,
    Long,
} = require("mongodb");
const {
    format,
} = require("date-fns");
const unzip = require("#lib/3rdparty/unzip-stream/unzip");
const Color = require("./color");
const filesData = require("#bin/data/files.json");
const directoriesData = require("#bin/data/directories.json");
const cleanupData = require("#bin/data/cleanup.json");

module.exports = class {
    constructor(options) {
        this.options = options;
        this.languages = Object.keys(fs.readJSONSync(fs.existsSync(path.resolve(__dirname, "../../../etc/languages.json")) ? path.resolve(__dirname, "../../../etc/languages.json") : path.resolve(__dirname, "../../core/defaults/config/languages.json")));
        this.color = new Color();
        this.logEnabled = true;
        this.logColor = !options || !options["no-color"];
        this.logNoDate = false;
        this.interactive = false;
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

    setLogPropertyColor(flag) {
        this.logColor = flag;
    }

    setInteractive(flag) {
        this.interactive = flag;
    }

    // eslint-disable-next-line generator-star-spacing
    async *walkDir(dir) {
        for await (const d of await fs.promises.opendir(dir)) {
            const entry = path.join(dir, d.name);
            if (d.isDirectory()) {
                yield* await this.walkDir(entry);
            } else if (d.isFile()) {
                yield entry;
            }
        }
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
        this.config = require(path.resolve(`${__dirname}/../../../etc/system.js`));
    }

    async connectDatabase() {
        if (this.config.mongo.enabled) {
            this.mongoClient = new MongoClient(this.config.mongo.url, this.config.mongo.options || {
                connectTimeoutMS: 5000,
            });
            await this.mongoClient.connect();
            this.db = this.mongoClient.db(this.config.mongo.dbName);
        }
    }

    disconnectDatabase() {
        if (this.config.mongo.enabled && this.db) {
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
            this.log(`Copying: "${item.to.replace(/\.\.\//gm, "")}"...`);
            fs.copySync(from, to);
        }
    }

    generateSecureConfig() {
        const configPath = path.resolve(__dirname, "../../../etc/secure.json");
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
            spaces: "  ",
        });
    }

    writeNavigationConfig() {
        const configDest = path.resolve(__dirname, "../../../etc/navigation.json");
        if (fs.existsSync(configDest)) {
            this.log(`Skipping: "etc/navigation.json"`, {
                warning: true,
            });
            return;
        }
        const configNavigation = fs.readJSONSync(path.resolve(__dirname, "../../core/defaults/config/navigation.json"));
        if (!fs.existsSync(path.resolve(__dirname, "../../../site/modules/sample"))) {
            configNavigation.routes = [];
        }
        this.log(`Writing "etc/navigation.json"...`, {
            header: true,
        });
        fs.writeJSONSync(configDest, configNavigation, {
            spaces: "  "
        });
    }

    writeUserTranslationData() {
        for (const lang of this.languages) {
            const filePath = path.resolve(__dirname, `../../../site/translations/${lang}.json`);
            if (fs.existsSync(filePath)) {
                this.log(`Skipping: "translations/${lang}.json"`, {
                    warning: true,
                });
                continue;
            }
            this.log(`Writing "translations/${lang}.json"...`, {
                header: true,
            });
            fs.writeJSONSync(filePath, {}, {
                spaces: "  "
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
        if (this.config.hashMethod === "argon2") {
            return argon2.hash(data);
        }
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
                active: true,
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
        if (resultUser && resultUser._id && resultGroup && resultGroup._id) {
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
                active: true,
            },
        }, {
            upsert: true,
        });
        if (resultUser && resultUser._id) {
            this.log(`User "${username}" has been created/updated in the database. New password is: password`);
        } else {
            this.log(`Could not create or update "${username}" user`, {
                warning: true,
            });
        }
    }

    addModule(id, addNavigationConfig = false) {
        this.log(`Creating module: "${id}"...`, {
            header: true,
        });
        if (!id || !id.match(/^[a-z0-9_-]+$/i)) {
            this.log("Invalid module ID, use latin characters, numbers and '-', '_' chars only", {
                warning: true,
            });
            return;
        }
        if (fs.existsSync(path.resolve(__dirname, `../../../site/modules/${id}`))) {
            this.log(`Module "${id}" already exists`, {
                warning: true,
            });
            return;
        }
        fs.copySync(path.resolve(__dirname, "../../core/defaults/modules/blank"), path.resolve(__dirname, `../../../site/modules/${id}`));
        const moduleConfigPath = path.resolve(__dirname, `../../../site/modules/${id}/module.json`);
        const moduleConfig = fs.readJSONSync(moduleConfigPath);
        moduleConfig.id = id;
        fs.writeJSONSync(moduleConfigPath, moduleConfig, {
            spaces: "  ",
        });
        if (addNavigationConfig) {
            const navJSONPath = path.resolve(__dirname, "../../../etc/navigation.json");
            const navJSON = fs.readJSONSync(navJSONPath);
            if (navJSON.userspace.routes.indexOf(id) === -1) {
                this.log(`Adding navbar item: ${id}_page...`);
                navJSON.userspace.routes.push(`${id}_page`);
                if (!navJSON.userspace.home) {
                    navJSON.userspace.home = `${id}_page`;
                }
                fs.writeJSONSync(navJSONPath, navJSON, {
                    spaces: "  ",
                });
            }
        }
    }

    removeModule(id) {
        this.log(`Removing module: ${id}...`, {
            header: true,
        });
        if (!id || !id.match(/^[a-z0-9_-]+$/i)) {
            this.log("Invalid module ID, use latin characters, numbers and '-', '_' chars only");
            return;
        }
        const modulePath = path.resolve(__dirname, "../../../site/modules", id);
        if (!fs.existsSync(modulePath)) {
            this.log(`Module '${id}' doesn't exists`, {
                warning: true,
            });
            return;
        }
        fs.removeSync(modulePath);
        const navJSONPath = path.resolve(__dirname, "../../../etc/navigation.json");
        const navJSON = fs.readJSONSync(navJSONPath);
        if (navJSON.userspace.routes.indexOf(`${id}_page`) >= 0) {
            this.log("Removing page from navbar...");
            navJSON.userspace.routes = navJSON.userspace.routes.filter(r => r !== `${id}_page`);
            navJSON.userspace.home = navJSON.home === `${id}_page` ? "" : navJSON.home;
            fs.writeJSONSync(navJSONPath, navJSON, {
                spaces: "  ",
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
        const languageJSONPath = path.resolve(__dirname, "../../../etc/languages.json");
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
            spaces: "  ",
        });
        this.log(`Modifying etc/meta.json...`);
        const mainMetaJSONPath = path.resolve(__dirname, "../../../etc/meta.json");
        const mainMetaJSON = fs.readJSONSync(mainMetaJSONPath);
        mainMetaJSON.title[id] = mainMetaJSON.title[Object.keys(languageJSON)[0]];
        mainMetaJSON.shortTitle[id] = mainMetaJSON.shortTitle[Object.keys(languageJSON)[0]];
        mainMetaJSON.description[id] = mainMetaJSON.description[Object.keys(languageJSON)[0]];
        fs.writeJSONSync(mainMetaJSONPath, mainMetaJSON, {
            spaces: "  ",
        });
        this.log("Modifying existing modules...");
        const buildJson = require("../../../build/build.json");
        for (const m of buildJson.modules) {
            if (m.translations) {
                const translationDataDefault = fs.readJSONSync(path.resolve(`${m.path}/translations/${Object.keys(languageJSON)[0]}.json`));
                fs.writeJSONSync(path.resolve(`${m.path}/translations/${id}.json`), translationDataDefault, {
                    spaces: "  ",
                });
            }
            for (const p of m.pages) {
                if (!fs.existsSync(path.resolve(`${m.path}/${p.id}/meta.json`))) {
                    continue;
                }
                const pageMetaJson = fs.readJSONSync(path.resolve(`${m.path}/${p.id}/meta.json`));
                if (pageMetaJson.title) {
                    pageMetaJson.title[id] = pageMetaJson.title[Object.keys(languageJSON)[0]];
                }
                if (pageMetaJson.description) {
                    pageMetaJson.description[id] = pageMetaJson.description[Object.keys(languageJSON)[0]];
                }
                fs.writeJSONSync(path.resolve(`${m.path}/${p.id}/meta.json`), pageMetaJson, {
                    spaces: "  ",
                });
                if (p.langSwitchComponent && !fs.existsSync(path.resolve(`${m.path}/${p.id}/content/lang-${id}`))) {
                    fs.ensureDirSync(path.resolve(`${m.path}/${p.id}/content/lang-${id}`));
                    fs.writeFileSync(path.resolve(`${m.path}/${p.id}/content/lang-${id}/index.marko`), `<div>${name}</div>`);
                }
            }
        }
        this.log("Modifying core translation files...");
        const transCoreJSON = fs.readJSONSync(path.resolve(__dirname, `../../translations/${Object.keys(languageJSON)[0]}.json`));
        fs.writeJSONSync(path.resolve(__dirname, `../../translations/${id}.json`), transCoreJSON, {
            spaces: "  "
        });
        if (fs.existsSync(path.resolve(__dirname, "../../../site/translations"))) {
            this.log("Modifying site translation files...");
            const transUserJSON = fs.readJSONSync(path.resolve(__dirname, `../../../site/translations/${Object.keys(languageJSON)[0]}.json`));
            fs.writeJSONSync(path.resolve(__dirname, `../../../site/translations/${id}.json`), transUserJSON, {
                spaces: "  "
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
        const languageJSONPath = path.resolve(__dirname, "../../../etc/languages.json");
        const languageJSON = fs.readJSONSync(languageJSONPath);
        delete languageJSON[id];
        fs.writeJSONSync(languageJSONPath, languageJSON, {
            spaces: "  ",
        });
        this.log(`Modifying etc/meta.json...`);
        const mainMetaJSONPath = path.resolve(__dirname, "../../../etc/meta.json");
        const mainMetaJSON = fs.readJSONSync(mainMetaJSONPath);
        delete mainMetaJSON.title[id];
        delete mainMetaJSON.shortTitle[id];
        delete mainMetaJSON.description[id];
        fs.writeJSONSync(mainMetaJSONPath, mainMetaJSON, {
            spaces: "  ",
        });
        this.log("Modifying existing modules...");
        const buildJson = require("../../../build/build.json");
        for (const m of buildJson.modules) {
            if (m.translations && fs.existsSync(path.resolve(`${m.path}/translations/${id}.json`))) {
                fs.removeSync(path.resolve(`${m.path}/translations/${id}.json`));
            }
            for (const p of m.pages) {
                if (!fs.existsSync(path.resolve(`${m.path}/${p.id}/meta.json`))) {
                    continue;
                }
                const pageMetaJson = fs.readJSONSync(path.resolve(`${m.path}/${p.id}/meta.json`));
                if (pageMetaJson.title) {
                    delete pageMetaJson.title[id];
                }
                if (pageMetaJson.description) {
                    delete pageMetaJson.description[id];
                }
                fs.writeJSONSync(path.resolve(`${m.path}/${p.id}/meta.json`), pageMetaJson, {
                    spaces: "  ",
                });
                if (fs.existsSync(path.resolve(`${m.path}/${p.id}/content/lang-${id}`))) {
                    fs.removeSync(path.resolve(`${m.path}/${p.id}/content/lang-${id}`));
                }
            }
        }
        this.log("Modifying core translation files...");
        const coreLangPath = path.resolve(__dirname, `../../translations/${id}.json`);
        if (fs.existsSync(coreLangPath)) {
            fs.removeSync(coreLangPath);
        }
        const userLangPath = path.resolve(__dirname, `../../../site/translations/${id}.json`);
        if (fs.existsSync(userLangPath)) {
            fs.removeSync(userLangPath);
        }
    }

    async geoCleanUp() {
        if (!this.db) {
            await this.connectDatabase();
        }
        this.log("Cleaning up...", {});
        await this.db.collection(this.config.collections.geoCountries).deleteMany({});
        await this.db.collection(this.config.collections.geoNetworks).deleteMany({});
        await this.db.collection(this.config.collections.geoCities).deleteMany({});
    }

    async geoImportBlocksV4() {
        if (!this.db) {
            await this.connectDatabase();
        }
        const {
            size: fileSize,
        } = fs.statSync(`${__dirname}/../geo/geoNetworksV4.hgd`);
        const fd = fs.openSync(`${__dirname}/../geo/geoNetworksV4.hgd`);
        let globalOffset = 0;
        const mainBufHead = Buffer.alloc(4);
        fs.readSync(fd, mainBufHead, 0, 4, globalOffset);
        const blockCount = (mainBufHead.readUInt32BE() / 2) + 1;
        globalOffset += 4;
        const progressBar = new cliProgress.SingleBar({
            format: `Importing IPv4 Data | {bar} {percentage}%`,
            barCompleteChar: "\u2588",
            barIncompleteChar: "\u2591",
            hideCursor: true
        });
        if (this.interactive) {
            progressBar.start(blockCount, 0);
        } else {
            this.log("Importing IPv4 Data...", {});
        }
        while (globalOffset <= fileSize) {
            if (this.interactive) {
                progressBar.increment();
                progressBar.update();
            }
            const bufHead = Buffer.alloc(4);
            fs.readSync(fd, bufHead, 0, 4, globalOffset);
            const size = bufHead.readUInt32BE();
            if (!size) {
                break;
            }
            const bufData = Buffer.alloc(size);
            fs.readSync(fd, bufData, 0, size, globalOffset + 4);
            const uncompressedBuf = zlib.brotliDecompressSync(bufData);
            let pos = 0;
            const insertData = [];
            while (pos < uncompressedBuf.length) {
                const geoNameIdCity = uncompressedBuf.readUInt32BE(pos);
                pos += 4;
                const geoNameIdCountry = uncompressedBuf.readUInt32BE(pos);
                pos += 4;
                const blockEnd = uncompressedBuf.readUInt32BE(pos);
                pos += 4;
                if (blockEnd) {
                    insertData.push({
                        geoNameIdCity: geoNameIdCity ? parseInt(geoNameIdCity, 10) : null,
                        geoNameIdCountry: geoNameIdCountry ? parseInt(geoNameIdCountry, 10) : null,
                        blockEnd,
                    });
                }
            }
            if (insertData.length) {
                await this.db.collection(this.config.collections.geoNetworks).insertMany(insertData);
            }
            globalOffset = globalOffset + size + 4;
        }
        if (this.interactive) {
            progressBar.stop();
        }
        fs.closeSync(fd);
    }

    async geoImportBlocksV6() {
        if (!this.db) {
            await this.connectDatabase();
        }
        const {
            size: fileSize,
        } = fs.statSync(`${__dirname}/../geo/geoNetworksV6.hgd`);
        const fd = fs.openSync(`${__dirname}/../geo/geoNetworksV6.hgd`);
        let globalOffset = 0;
        const mainBufHead = Buffer.alloc(4);
        fs.readSync(fd, mainBufHead, 0, 4, globalOffset);
        const blockCount = (mainBufHead.readUInt32BE() / 2) + 1;
        globalOffset += 4;
        const progressBar = new cliProgress.SingleBar({
            format: `Importing IPv6 Data | {bar} {percentage}%`,
            barCompleteChar: "\u2588",
            barIncompleteChar: "\u2591",
            hideCursor: true
        });
        if (this.interactive) {
            progressBar.start(blockCount, 0);
        } else {
            this.log("Importing IPv6 Data...", {});
        }
        while (globalOffset <= fileSize) {
            if (this.interactive) {
                progressBar.increment();
                progressBar.update();
            }
            const bufHead = Buffer.alloc(4);
            fs.readSync(fd, bufHead, 0, 4, globalOffset);
            const size = bufHead.readUInt32BE();
            if (!size) {
                break;
            }
            const bufData = Buffer.alloc(size);
            fs.readSync(fd, bufData, 0, size, globalOffset + 4);
            const uncompressedBuf = zlib.brotliDecompressSync(bufData);
            let pos = 0;
            const insertData = [];
            while (pos < uncompressedBuf.length) {
                const geoNameIdCity = uncompressedBuf.readUInt32BE(pos);
                const geoNameIdCountry = uncompressedBuf.readUInt32BE(pos + 4);
                const blockEnd1 = uncompressedBuf.readBigUint64BE(pos + 8);
                const blockEnd2 = uncompressedBuf.readBigUint64BE(pos + 16);
                const blockEnd = BigInt(`${blockEnd1.toString()}${blockEnd2.toString()}`);
                pos += 24;
                if (blockEnd) {
                    insertData.push({
                        geoNameIdCity: geoNameIdCity ? parseInt(geoNameIdCity, 10) : null,
                        geoNameIdCountry: geoNameIdCountry ? parseInt(geoNameIdCountry, 10) : null,
                        blockEnd: new Long(blockEnd),
                    });
                }
            }
            if (insertData.length) {
                await this.db.collection(this.config.collections.geoNetworks).insertMany(insertData);
            }
            globalOffset = globalOffset + size + 4;
        }
        if (this.interactive) {
            progressBar.stop();
        }
        fs.closeSync(fd);
    }

    async geoImportCountries() {
        if (!this.db) {
            await this.connectDatabase();
        }
        const {
            size: fileSize,
        } = fs.statSync(`${__dirname}/../geo/geoCountries.hgd`);
        const fd = fs.openSync(`${__dirname}/../geo/geoCountries.hgd`);
        let globalOffset = 0;
        const mainBufHead = Buffer.alloc(4);
        fs.readSync(fd, mainBufHead, 0, 4, globalOffset);
        const blockCount = mainBufHead.readUInt32BE() / 2;
        globalOffset += 4;
        const progressBar = new cliProgress.SingleBar({
            format: `Importing CNTR Data | {bar} {percentage}%`,
            barCompleteChar: "\u2588",
            barIncompleteChar: "\u2591",
            hideCursor: true
        });
        if (this.interactive) {
            progressBar.start(blockCount, 0);
        } else {
            this.log("Importing CNTR Data...", {});
        }
        const insertData = [];
        while (globalOffset <= fileSize) {
            if (this.interactive) {
                progressBar.increment();
                progressBar.update();
            }
            const bufHead = Buffer.alloc(4);
            fs.readSync(fd, bufHead, 0, 4, globalOffset);
            const size = bufHead.readUInt32BE();
            if (!size) {
                break;
            }
            const bufData = Buffer.alloc(size);
            fs.readSync(fd, bufData, 0, size, globalOffset + 4);
            const uncompressedBuf = zlib.brotliDecompressSync(bufData);
            let pos = 0;
            const geoNameId = parseInt(uncompressedBuf.readUInt32BE(pos), 10);
            pos += 4;
            const continentCode = uncompressedBuf.subarray(pos, pos + 2).toString();
            pos += 2;
            const countryCode = uncompressedBuf.subarray(pos, pos + 2).toString();
            pos += 2;
            const eu = uncompressedBuf.readUInt8(pos);
            pos += 1;
            const strDataLen = uncompressedBuf.readUInt16BE(pos);
            pos += 4;
            const strData = uncompressedBuf.subarray(pos, pos + strDataLen).toString();
            const data = {};
            const strArr = strData.split(/\t/);
            for (let i = 0; i < strArr.length; i += 3) {
                if (strArr[i + 1]) {
                    data[strArr[i]] = data[strArr[i]] || {};
                    data[strArr[i]].continent = strArr[i + 1];
                }
                if (strArr[i + 2]) {
                    data[strArr[i]] = data[strArr[i]] || {};
                    // eslint-disable-next-line no-control-regex
                    data[strArr[i]].country = strArr[i + 2].replace(/\x00/gm, "");
                }
            }
            insertData.push({
                _id: String(geoNameId),
                continentCode,
                countryCode,
                eu: eu === 1,
                ...data,
            });
            globalOffset = globalOffset + size + 4;
        }
        if (insertData.length) {
            await this.db.collection(this.config.collections.geoCountries).insertMany(insertData);
        }
        if (this.interactive) {
            progressBar.stop();
        }
        fs.closeSync(fd);
    }

    async geoImportCities() {
        if (!this.db) {
            await this.connectDatabase();
        }
        const {
            size: fileSize,
        } = fs.statSync(`${__dirname}/../geo/geoCities.hgd`);
        const fd = fs.openSync(`${__dirname}/../geo/geoCities.hgd`);
        let globalOffset = 0;
        const mainBufHead = Buffer.alloc(4);
        fs.readSync(fd, mainBufHead, 0, 4, globalOffset);
        const blockCount = mainBufHead.readUInt32BE() / 2;
        globalOffset += 4;
        const insertData = [];
        const progressBar = new cliProgress.SingleBar({
            format: `Importing CITY Data | {bar} {percentage}%`,
            barCompleteChar: "\u2588",
            barIncompleteChar: "\u2591",
            hideCursor: true
        });
        if (this.interactive) {
            progressBar.start(blockCount, 0);
        } else {
            this.log("Importing CITY Data...", {});
        }
        while (globalOffset <= fileSize) {
            if (this.interactive) {
                progressBar.increment();
                progressBar.update();
            }
            const bufHead = Buffer.alloc(4);
            fs.readSync(fd, bufHead, 0, 4, globalOffset);
            const size = bufHead.readUInt32BE();
            if (!size) {
                break;
            }
            const bufData = Buffer.alloc(size);
            fs.readSync(fd, bufData, 0, size, globalOffset + 4);
            const uncompressedBuf = zlib.brotliDecompressSync(bufData);
            let pos = 0;
            const geoNameId = parseInt(uncompressedBuf.readUInt32BE(pos), 10);
            pos += 4;
            const strDataLen = uncompressedBuf.readUInt16BE(pos);
            pos += 4;
            const strData = uncompressedBuf.subarray(pos, pos + strDataLen).toString();
            const data = {};
            const strArr = strData.split(/\t/);
            for (let i = 0; i < strArr.length; i += 2) {
                if (strArr[i + 1]) {
                    data[strArr[i]] = data[strArr[i]] || {};
                    // eslint-disable-next-line no-control-regex
                    data[strArr[i]] = strArr[i + 1].replace(/\x00/gm, "");
                }
            }
            if (geoNameId && Object.keys(data).length) {
                insertData.push({
                    _id: String(geoNameId),
                    ...data,
                });
            }
            if (insertData.length > 9999) {
                await this.db.collection(this.config.collections.geoCities).insertMany(insertData);
                insertData.length = 0;
            }
            globalOffset = globalOffset + size + 4;
        }
        if (insertData.length) {
            await this.db.collection(this.config.collections.geoCities).insertMany(insertData);
        }
        if (this.interactive) {
            progressBar.stop();
        }
        fs.closeSync(fd);
    }

    async geoEnsureIndexes() {
        if (!this.db) {
            await this.connectDatabase();
        }
        this.log("Creating indexes...", {});
        try {
            await this.db.collection(this.config.collections.geoNetworks).createIndex({
                blockEnd: 1,
            }, {
                name: "blockEndIndex",
            });
        } catch {
            // Ignore
        }
    }

    printLogo() {
        if (this.logColor) {
            // eslint-disable-next-line no-console
            console.log(`${this.color.get("                 ", ["bgGreen"])}\n${this.color.get("  H E R E T I C  ", ["bgGreen", "whiteBright"])}\n${this.color.get("                 ", ["bgGreen"])}\n`);
        } else {
            // eslint-disable-next-line no-console
            console.log("╔═════════════════╗\n║                 ║\n║  H E R E T I C  ║\n║                 ║\n╚═════════════════╝\n");
        }
    }

    async executeCommand(command = "", options = {}) {
        return new Promise((resolve, reject) => {
            try {
                const res = {
                    stdout: "",
                    exitCode: 1,
                };
                const commandArr = command.split(/ /);
                if (!commandArr.length) {
                    reject(new Error("No command specified"));
                }
                const cmd = commandArr.shift();
                const result = spawn(cmd, commandArr, {
                    env: {
                        ...process.env,
                        MARKO_DEBUG: false,
                    }
                });
                result.stdout.on("data", data => {
                    if (!options.disableConsole) {
                        // eslint-disable-next-line no-console
                        console.log(data.toString());
                    }
                    res.stdout += data.toString();
                });
                result.stderr.on("data", data => {
                    if (!options.disableConsole) {
                        // eslint-disable-next-line no-console
                        console.log(data.toString());
                    }
                });
                result.on("close", code => resolve(({
                    ...res,
                    exitCode: code,
                })));
                result.on("error", error => reject(error));
            } catch (e) {
                reject(e);
            }
        });
    }

    getCliCommandLineArgs() {
        return [{
            name: "addModule",
            type: String,
        }, {
            name: "removeModule",
            type: String,
        }, {
            name: "addLanguage",
            type: String,
        }, {
            name: "removeLanguage",
            type: String,
        }, {
            name: "resetPassword",
            type: String,
        }, {
            name: "createAdmin",
            type: String,
        }, {
            name: "addNavigation",
            type: Boolean,
        }, {
            name: "importGeoData",
            type: Boolean,
        }, {
            name: "no-color",
            type: Boolean,
        }];
    }

    getDockerCommandLineArgs() {
        return [{
            name: "id",
            type: String,
        }, {
            name: "heretic-port",
            type: String,
        }, {
            name: "mongo-port",
            type: String,
        }, {
            name: "redis-port",
            type: String,
        }, {
            name: "public-dir",
            type: String,
        }, {
            name: "demo",
            type: Boolean,
        }];
    }

    getUpdateCommandLineArgs() {
        return [{
            name: "rebuild-dev",
            type: Boolean,
        }, {
            name: "rebuild-production",
            type: Boolean,
        }, {
            name: "restart-pm2",
            type: Boolean,
        }, {
            name: "npm-install",
            type: Boolean,
        }];
    }

    getBackupCommandLineArgs() {
        return [{
            name: "filename",
            type: String,
        }, {
            name: "dir",
            type: String,
        }];
    }

    getBuildCommandLineArgs() {
        return [{
            name: "dev",
            type: Boolean,
        }, {
            name: "no-color",
            type: Boolean,
        }];
    }

    getRestoreCommandLineArgs() {
        return [{
            name: "path",
            type: String,
        }, {
            name: "no-save",
            type: Boolean,
        }];
    }

    async extractUpdate(data, dirPath) {
        return new Promise((resolve, reject) => {
            data.pipe(unzip.Parse())
                .on("entry", (entry) => {
                    const {
                        type,
                        path: entryPath,
                    } = entry;
                    const entryPathParsed = entryPath.replace(/hereticjsorg-heretic-[a-z0-9]+\//, "");
                    if (type === "Directory") {
                        fs.ensureDirSync(path.join(dirPath, entryPathParsed));
                        entry.autodrain();
                    } else {
                        const entryDirName = path.dirname(entryPathParsed) === "." ? "root" : path.dirname(entryPathParsed);
                        fs.ensureDirSync(path.join(dirPath, entryDirName));
                        const entryFileName = path.basename(entryPathParsed);
                        if (!entryFileName.match(/\.hgd$/)) {
                            entry.pipe(fs.createWriteStream(path.join(dirPath, entryDirName, entryFileName)));
                        } else {
                            entry.autodrain();
                        }
                    }
                })
                .on("close", () => resolve())
                .on("reject", e => reject(e));
        });
    }

    async extractBackup(data, dirPath) {
        return new Promise((resolve, reject) => {
            data.pipe(unzip.Parse())
                .on("entry", (entry) => {
                    const {
                        type,
                        path: entryPath,
                    } = entry;
                    if (type === "Directory") {
                        fs.ensureDirSync(path.join(dirPath, entryPath));
                        entry.autodrain();
                    } else {
                        const entryDirName = path.dirname(entryPath);
                        fs.ensureDirSync(path.join(dirPath, entryDirName));
                        const entryFileName = path.basename(entryPath);
                        entry.pipe(fs.createWriteStream(path.join(dirPath, entryDirName, entryFileName)));
                    }
                })
                .on("close", () => resolve())
                .on("reject", e => reject(e));
        });
    }

    async patchPackageJson(dirPath) {
        const oldPackageJson = await fs.readJSON(path.join(__dirname, "../../../package.json"));
        const newPackageJson = await fs.readJSON(path.join(dirPath, "root/package.json"));
        for (const k of Object.keys(newPackageJson.devDependencies)) {
            if (!oldPackageJson.devDependencies[k] || oldPackageJson.devDependencies[k] !== newPackageJson.devDependencies[k]) {
                oldPackageJson.devDependencies[k] = newPackageJson.devDependencies[k];
            }
        }
        for (const k of Object.keys(newPackageJson.dependencies)) {
            if (!oldPackageJson.dependencies[k] || oldPackageJson.dependencies[k] !== newPackageJson.dependencies[k]) {
                oldPackageJson.dependencies[k] = newPackageJson.dependencies[k];
            }
        }
        for (const k of Object.keys(newPackageJson.scripts)) {
            if (!oldPackageJson.scripts[k] || oldPackageJson.scripts[k] !== newPackageJson.scripts[k]) {
                oldPackageJson.scripts[k] = newPackageJson.scripts[k];
            }
        }
        for (const k of Object.keys(newPackageJson.imports)) {
            if (!oldPackageJson.imports[k] || oldPackageJson.imports[k] !== newPackageJson.imports[k]) {
                oldPackageJson.imports[k] = newPackageJson.imports[k];
            }
        }
        oldPackageJson.version = newPackageJson.version;
        await fs.writeJson(path.join(__dirname, "../../../package.json"), oldPackageJson, {
            spaces: "    ",
        });
    }
};
