const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const axios = require("axios").default;
const {
    v4: uuidv4
} = require("uuid");

const BinUtils = require(path.resolve(`${__dirname}/binUtils`));
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
        await fs.copy(path.join(dirPath, "manual"), path.join(__dirname, "../../manual"));
        const rootFiles = (await fs.readdir(path.join(dirPath, "root"))).filter(f => f !== "package.json");
        for (const file of rootFiles) {
            await fs.copy(path.join(dirPath, "root", file), path.join(__dirname, "../..", file));
        }
        binUtils.log("Patching package.json...");
        await binUtils.patchPackageJson(dirPath);
        binUtils.log("Cleaning up...");
        await fs.remove(dirPath);
        binUtils.log("All done. Please run 'npm run install' to update NPM packages.", {
            success: true,
        });
    } catch (e) {
        binUtils.log(e.message, {
            error: true,
            noDate: true,
        });
        process.exit(1);
    }
})();
