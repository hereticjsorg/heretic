const fs = require("fs-extra");

const os = require("os");
const path = require("path");
const commandLineArgs = require("command-line-args");
const BinUtils = require("./lib/binUtils");

(async () => {
    const binUtils = new BinUtils();
    binUtils.setLogProperties({
        enabled: true,
        color: true,
        noDate: false,
    });
    binUtils.setInteractive(true);
    let options;
    try {
        options = commandLineArgs(binUtils.getBuildCommandLineArgs());
    } catch (e) {
        binUtils.log(e.message);
        process.exit(1);
    }
    if (options["no-color"]) {
        binUtils.setLogPropertyColor(false);
    }
    binUtils.printLogo();
    try {
        binUtils.log(`Building Heretic in ${options.dev ? "development" : "production"} mode${options.dev ? "" : " (may take a long time!)"}...`);
        const data = await binUtils.executeCommand(`npm${os.platform() === "win32" ? ".cmd" : ""} run build-${options.dev ? "dev" : "production"} -- --no-color`);
        const buildResultMatch = data && data.exitCode === 0 && typeof data.stdout === "string" ? data.stdout.match(/compiled successfully/gm) : [];
        const isSuccess = buildResultMatch && Array.isArray(buildResultMatch) && buildResultMatch.length === 2;
        binUtils.log(isSuccess ? "Build successful." : `Error while building Heretic:\n\n${data.stdout}`, {
            success: isSuccess,
            error: !isSuccess,
        });
        if (isSuccess) {
            binUtils.log("Cleaning up...");
            await fs.remove(path.join(__dirname, "../../dist/public/heretic"));
            await fs.remove(path.join(__dirname, "../../dist/data"));
            await fs.remove(path.join(__dirname, "../../dist/server.js"));
            binUtils.log("Replacing files and directories...");
            await fs.remove(path.join(__dirname, "../../dist/public/heretic"));
            await fs.copy(path.join(__dirname, "../../dist.new/public/heretic"), path.join(__dirname, "../../dist/public/heretic"));
            await fs.remove(path.join(__dirname, "../../dist/data"));
            await fs.copy(path.join(__dirname, "../../dist.new/data"), path.join(__dirname, "../../dist/data"));
            await fs.remove(path.join(__dirname, "../../dist/server.js"));
            await fs.copy(path.join(__dirname, "../../dist.new/server.js"), path.join(__dirname, "../../dist/server.js"));
            await fs.remove(path.join(__dirname, "../../dist.new"));
            binUtils.log("All done.", {
                success: true,
            });
            process.exit(0);
        } else {
            binUtils.log("Cleaning up...");
            await fs.remove(path.join(__dirname, "../../dist.new"));
            binUtils.log("Could not finish build process.", {
                error: true,
            });
            process.exit(1);
        }
    } catch (e) {
        binUtils.log(e.message, {
            error: true,
        });
        try {
            await fs.remove(path.join(__dirname, "../../dist.new"));
        } catch {
            // Ignore
        }
        process.exit(1);
    }
})();
