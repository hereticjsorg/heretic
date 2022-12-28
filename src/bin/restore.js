const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const {
    format,
} = require("date-fns");
const commandLineArgs = require("command-line-args");
const {
    v4: uuidv4,
} = require("uuid");
const BinUtils = require("./binUtils");

const dirsArchive = ["dist", "etc", "src"];

(async () => {
    const inquirer = (await import("inquirer")).default;
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
        options = commandLineArgs(binUtils.getRestoreCommandLineArgs());
    } catch (e) {
        binUtils.log(e.message);
        process.exit(1);
    }
    const archivePath = path.resolve(__dirname, `../../${options.path}`);
    if (!options.path || !fs.existsSync(archivePath)) {
        binUtils.log(`Usage: npm run restore -- --path "path/to/backup.zip`);
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
        const restoreId = uuidv4();
        const dirPath = config.directories.tmp ? path.resolve(__dirname, config.directories.tmp, restoreId) : path.join(os.tmpdir(), restoreId);
        // const oldPath = path.resolve(__dirname, `../../${format(new Date(), "yyyyMMdd_HHmmss")}`);
        binUtils.log("WARNING: your current directories will be overwritten.\nAll database collections will be dropped and overwritten by backup files.", {
            warning: true,
        });
        const confirmation = await inquirer.prompt([{
            type: "input",
            name: "confirmed",
            message: `Enter ${config.id.toUpperCase()} to continue:`,
        }]);
        if (confirmation.confirmed !== config.id.toUpperCase()) {
            binUtils.log("Cancelled.");
            process.exit();
        }
        await fs.ensureDir(dirPath);
        binUtils.log("Extracting backup archive...");
        const archiveStream = fs.createReadStream(archivePath);
        await binUtils.extractBackup(archiveStream, dirPath);
        for (const dir of dirsArchive) {
            const srcDir = path.join(dirPath, dir);
            const destDir = path.join(__dirname, "../..", dir);
            binUtils.log(`Dropping directory: "${dir}"...`);
            await fs.remove(destDir);
            binUtils.log(`Restoring directory: "${dir}"...`);
            await fs.copy(srcDir, destDir);
        }
        const rootFiles = await fs.readdir(path.join(dirPath, "root"));
        for (const file of rootFiles) {
            const srcFile = path.join(dirPath, file);
            const destFile = path.join(__dirname, "../..", file);
            binUtils.log(`Deleting file: "${file}"...`);
            await fs.remove(destFile);
            binUtils.log(`Restoring file: "${file}"...`);
            await fs.copy(srcFile, destFile);
        }
        binUtils.log("Dropping collections...");
        await binUtils.connectDatabase();
        const collections = (await binUtils.db.listCollections().toArray()).map(i => i.name);
        for (const collection of collections) {
            binUtils.log(`Dropping collection: "${collection}"...`);
            await binUtils.db.collection(collection).drop();
            binUtils.log(`Restoring collection: "${collection}"...`);
            await binUtils.executeCommand(`mongorestore --db ${config.mongo.dbName} --collection ${collection} --out "${path.join(dirPath, "dump")}"`);
        }
        binUtils.disconnectDatabase();
    } catch (e) {
        console.log(e);
        binUtils.log(e.message, {
            error: true,
        });
        process.exit(1);
    }
})();
