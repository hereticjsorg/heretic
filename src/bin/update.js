const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const unzip = require("unzip-stream");
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

const masterUrl = "http://github.com/xtremespb/heretic/zipball/master/";

const extractUpdate = (data, dirPath) => new Promise((resolve, reject) => {
    data.pipe(unzip.Parse())
        .on("entry", (entry) => {
            const {
                type,
                path: entryPath,
            } = entry;
            const entryPathParsed = entryPath.replace(/xtremespb-heretic-[a-z0-9]+\//, "");
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

const patchPackageJson = async dirPath => {
    const oldPackageJson = await fs.readJSON(path.join(__dirname, "../../package.json"));
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
    oldPackageJson.version = newPackageJson.version;
    await fs.writeJson(path.join(__dirname, "../../package.json"), oldPackageJson, {
        spaces: "\t",
    });
};

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
            url: masterUrl,
            responseType: "stream",
        });
        binUtils.log("Extracting archive...");
        await extractUpdate(data, dirPath);
        binUtils.log("Copying files...");
        await fs.copy(path.join(dirPath, "src"), path.join(__dirname, "../../src2"));
        await fs.copy(path.join(dirPath, "manual"), path.join(__dirname, "../../manual2"));
        const rootFiles = (await fs.readdir(path.join(dirPath, "root"))).filter(f => f !== "package.json");
        for (const file of rootFiles) {
            await fs.copy(path.join(dirPath, "root", file), path.join(__dirname, "../..", file));
        }
        binUtils.log("Patching package.json...");
        await patchPackageJson(dirPath);
        binUtils.log("Cleaning up...");
        await fs.remove(dirPath);
        binUtils.log("All done. Please run 'npm run install' to update NPM packages.");
    } catch (e) {
        binUtils.log(e.message, {
            error: true,
            noDate: true,
        });
        process.exit(1);
    }
})();
