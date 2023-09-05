const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const axios = require("axios").default;
const commandLineArgs = require("command-line-args");
const {
    v4: uuidv4
} = require("uuid");

const BinUtils = require("#lib/binUtils.js");

const config = require(path.resolve(`${__dirname}/../../etc/system`));

const binUtils = new BinUtils({});
binUtils.setLogProperties({
    enabled: true,
    color: true,
    noDate: true,
});
binUtils.readConfig();
binUtils.printLogo();

(async () => {
    let options;
    try {
        options = commandLineArgs(binUtils.getUpdateCommandLineArgs());
    } catch (e) {
        binUtils.log(e.message, {
            error: true
        });
        process.exit(1);
    }
    if (config.directories.tmp) {
        await fs.ensureDir(path.resolve(__dirname, "dist", config.directories.tmp));
    }
    const updateId = uuidv4();
    const dirPath = config.directories.tmp ? path.resolve(__dirname, config.directories.tmp, updateId) : path.join(os.tmpdir(), updateId);
    await fs.emptyDir(dirPath);
    try {
        binUtils.log("Downloading update archive...");
        const {
            data,
        } = await axios({
            method: "get",
            url: config.heretic.zipball,
            responseType: "stream",
        });
        binUtils.log("Extracting archive...");
        await binUtils.extractUpdate(data, dirPath);
        binUtils.log("Copying files...");
        await fs.copy(path.join(dirPath, "src"), path.join(__dirname, "../../src"));
        await fs.copy(path.join(dirPath, "docs"), path.join(__dirname, "../../docs"));
        const rootFiles = (await fs.readdir(path.join(dirPath, "root"))).filter(f => f !== "package.json");
        for (const file of rootFiles) {
            await fs.copy(path.join(dirPath, "root", file), path.join(__dirname, "../..", file));
        }
        binUtils.log("Patching package.json...");
        await binUtils.patchPackageJson(dirPath);
        binUtils.log("Cleaning up...");
        await fs.remove(dirPath);
        if (options["npm-install"]) {
            binUtils.log("Updating NPM packages...");
            await binUtils.executeCommand(`npm${os.platform() === "win32" ? ".cmd" : ""} i`);
        }
        if (options["rebuild-dev"]) {
            binUtils.log("Rebuilding Heretic in development mode...");
            await binUtils.executeCommand(`npm${os.platform() === "win32" ? ".cmd" : ""} run build -- --dev`);
        } else if (options["rebuild-production"]) {
            binUtils.log("Rebuilding Heretic in production mode...");
            await binUtils.executeCommand(`npm${os.platform() === "win32" ? ".cmd" : ""} run build`);
        }
        if (options["restart-pm2"]) {
            try {
                binUtils.log(`Restarting PM2 process '${config.id}'...`);
                await binUtils.executeCommand(`pm2 restart ${config.id}`);
            } catch {
                binUtils.log("Could not restart PM2 process. Is PM2 installed?", {
                    error: true,
                });
            }
        }
        binUtils.log("All done.", {
            success: true,
        });
        if (!options["npm-install"]) {
            binUtils.log("Please run 'npm install' in order to update NPM modules");
        }
        if (!options["rebuild-dev"] && !options["rebuild-production"]) {
            binUtils.log("Please run 'npm run build' in order to rebuild Heretic");
        }
        if (!options["restart-pm2"]) {
            binUtils.log(`Please run 'pm2 restart ${config.id}' in order to restart Heretic`);
        }
    } catch (e) {
        binUtils.log(e.message, {
            error: true,
        });
        process.exit(1);
    }
})();
