const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const commandLineArgs = require("command-line-args");
const {
    v4: uuidv4,
} = require("uuid");
const BinUtils = require("./binUtils");

const dirsArchive = ["dist", "src", "etc", "root", "dump"];

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
        options = commandLineArgs(binUtils.getRestoreCommandLineArgs());
    } catch (e) {
        binUtils.log(e.message);
        process.exit(1);
    }
    if (!options.path || !fs.existsSync(path.resolve(__dirname, `../../${options.path}`))) {
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
                noDate: true,
            });
            process.exit(1);
        }
        binUtils.readConfig();
    } catch (e) {
        binUtils.log(e.message, {
            error: true,
            noDate: true,
        });
        process.exit(1);
    }
})();
