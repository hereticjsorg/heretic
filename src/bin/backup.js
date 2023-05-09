const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const commandLineArgs = require("command-line-args");
const {
    format,
} = require("date-fns");
const archiver = require("archiver");
const {
    v4: uuidv4,
} = require("uuid");
const BinUtils = require("./binUtils");

const dirsArchive = ["dist", "src", "etc", "root", "dump"];
const saveBackupArchive = (dirPath, destPath) => new Promise((resolve, reject) => {
    try {
        const archive = archiver("zip", {
            zlib: {
                level: 9
            }
        });
        const output = fs.createWriteStream(destPath);
        output.on("error", e => {
            reject(e);
        });
        archive.pipe(output);
        for (const dir of dirsArchive) {
            const srcDir = path.join(dirPath, dir);
            if (!fs.existsSync(srcDir)) {
                continue;
            }
            archive.directory(srcDir, dir);
        }
        output.on("close", () => {
            resolve(this.id);
        });
        archive.on("error", e => {
            reject(e);
        });
        archive.finalize();
    } catch (e) {
        reject(e);
    }
});

(async () => {
    const binUtils = new BinUtils();
    binUtils.setLogProperties({
        enabled: true,
        color: true,
        noDate: true,
    });
    binUtils.setInteractive(true);
    binUtils.printLogo();
    let options;
    try {
        options = commandLineArgs(binUtils.getBackupCommandLineArgs());
    } catch (e) {
        binUtils.log(e.message);
        process.exit(1);
    }
    try {
        let config;
        try {
            config = require(path.join(__dirname, "../../etc/system"));
        } catch {
            binUtils.log("Error: configuration file is missing", {
                error: true,
            });
            process.exit(1);
        }
        binUtils.readConfig();
        if (config.directories.tmp) {
            fs.ensureDirSync(path.resolve(__dirname, "dist", config.directories.tmp));
        }
        const backupId = uuidv4();
        const dirPath = config.directories.tmp ? path.resolve(__dirname, config.directories.tmp, backupId) : path.join(os.tmpdir(), backupId);
        binUtils.log("Copying directories...");
        await fs.ensureDir(dirPath);
        await fs.copy(path.join(__dirname, "../../dist"), path.join(dirPath, "dist"));
        await fs.copy(path.join(__dirname, "../../src"), path.join(dirPath, "src"));
        await fs.copy(path.join(__dirname, "../../etc"), path.join(dirPath, "etc"));
        await fs.remove(path.join(dirPath, "src", "bin", "data"));
        await fs.ensureDir(path.join(dirPath, "src", "bin", "data"));
        await fs.ensureDir(path.join(dirPath, "root"));
        for (const file of ["package.json", "package-lock.json", "webpack.config.js", "webpack.utils.js"]) {
            await fs.copy(path.join(__dirname, "../..", file), path.join(dirPath, "root", file));
        }
        await fs.ensureDir(path.join(dirPath, "dump"));
        if (config.mongo.enabled) {
            binUtils.log("Dumping database collections...");
            await binUtils.connectDatabase();
            const collections = (await binUtils.db.listCollections().toArray()).map(i => i.name);
            binUtils.disconnectDatabase();
            const {
                host,
                port,
            } = new URL(config.mongo.url);
            for (const collection of collections.filter(i => ["geoNetworks", "geoCountries", "geoCities"].indexOf(i) === -1)) {
                await binUtils.executeCommand(`mongodump --host=${host} --port=${port} --db ${config.mongo.dbName} --collection ${collection} --out "${path.join(dirPath, "dump")}"`);
            }
        }
        const archiveFilePath = path.resolve(dirPath, `${uuidv4()}.zip`);
        binUtils.log("Creating backup archive...");
        await saveBackupArchive(dirPath, archiveFilePath);
        for (const dir of dirsArchive) {
            const srcDir = path.join(dirPath, dir);
            await fs.remove(srcDir);
        }
        const backupDirPath = path.join(__dirname, options.dir ? `../../${options.dir}` : "../../backup");
        await fs.ensureDir(backupDirPath);
        const archiveFilename = options.filename || `${config.id}_${format(new Date(), "yyyyMMdd_HHmmss")}.zip`;
        await fs.copy(archiveFilePath, path.join(backupDirPath, archiveFilename));
        await fs.remove(dirPath);
        binUtils.log(`Backup has been created successfully: ${options.dir ? path.resolve(options.dir) : "backup"}/${archiveFilename}`, {
            success: true,
        });
    } catch (e) {
        binUtils.log(e.message, {
            error: true,
        });
        process.exit(1);
    }
})();
