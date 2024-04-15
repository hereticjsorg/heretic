const path = require("path");
const fs = require("fs-extra");
const commandLineArgs = require("command-line-args");

const BinUtils = require("#lib/binUtils.js");

const binUtils = new BinUtils({});
let options;
try {
    options = commandLineArgs(binUtils.getCliCommandLineArgs());
} catch (e) {
    binUtils.log(e.message);
    process.exit(1);
}

if (options["no-color"]) {
    binUtils.setLogPropertyColor(false);
}
binUtils.setLogProperties({
    enabled: true,
    color: true,
    noDate: true,
});
binUtils.printLogo();

(async () => {
    try {
        const id = options.id || "heretic";
        const hereticPort = options["heretic-port"] || 3001;
        const mongoPort = options["heretic-port"] || 27020;
        const redisPort = options["redis-port"] || 6379;
        const distDir = options["dist-dir"] || "./dist";
        const siteDir = options["site-dir"] || "./site";
        const srcDir = options["src-dir"] || "./src";
        const backupDir = options["backup-dir"] || "./backup";
        const logsDir = options["logs-dir"] || "./logs";
        const mongoDir = options["mongo-dir"] || "./mongo";
        const demo = !!options.demo;
        binUtils.log("Processing templates...");
        const dockerComposeTemplate = (await fs.readFile(path.resolve(__dirname, "data/docker-compose.yml"), "utf8"))
            .replace(/\$ID/gm, id)
            .replace(/\$HERETIC_PORT/gm, hereticPort)
            .replace(/\$MONGO_PORT/gm, mongoPort)
            .replace(/\$REDIS_PORT/gm, redisPort)
            .replace(/\$DIST_DIR/gm, distDir)
            .replace(/\$SITE_DIR/gm, siteDir)
            .replace(/\$SRC_DIR/gm, srcDir)
            .replace(/\$LOGS_DIR/gm, logsDir)
            .replace(/\$BACKUP_DIR/gm, backupDir)
            .replace(/\$MONGO_DIR/gm, mongoDir)
            .replace(/\$DEMO/gm, demo);
        binUtils.log("Writing docker-compose.yml...");
        await fs.writeFile(path.resolve(__dirname, "../../docker-compose.yml"), dockerComposeTemplate, "utf8");
        binUtils.log("All done.", {
            success: true,
        });
    } catch (e) {
        binUtils.log(e.message, {
            error: true,
        });
        process.exit(1);
    }
})();
