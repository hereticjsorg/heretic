const commandLineArgs = require("command-line-args");
const BinUtils = require("./lib/binUtils");

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

binUtils.printLogo();

(async () => {
    if (!Object.keys(options).length || (Object.keys(options).length === 1 && options["no-color"])) {
        binUtils.log(`Usage:\n\nnpm run cli -- --addModule <id> [--addNavigation] - create a new page [add navigation]
               --removeModule <id> - delete existing page
               --addLanguage <id:name> - add new language (example: de-de:Deutsch)
               --removeLanguage <id> - delete existing language
               --importGeoData - import geo database
               --createAdmin - create or update "admin" user and corresponding group
               --resetPassword <username> - create user or reset password to "password"\n`, {
            noDate: true,
        });
        process.exit(0);
    }

    binUtils.readConfig();

    if (options.addModule !== undefined) {
        binUtils.addModule(options.addModule, options.addNavigation);
    }

    if (options.removeModule !== undefined) {
        binUtils.removeModule(options.removeModule);
    }

    if (options.addLanguage !== undefined) {
        const [id, name] = options.addLanguage.split(/:/);
        binUtils.addLanguage(id, name);
    }

    if (options.removeLanguage !== undefined) {
        binUtils.removeLanguage(options.removeLanguage);
    }

    if (options.resetPassword !== undefined) {
        await binUtils.resetPassword(options.resetPassword);
    }

    if (options.createAdmin !== undefined) {
        await binUtils.createAdmin();
    }

    if (options.importGeoData !== undefined) {
        await binUtils.geoCleanUp();
        await binUtils.geoImportBlocksV4();
        await binUtils.geoImportBlocksV6();
        await binUtils.geoImportCities();
        await binUtils.geoImportCountries();
        await binUtils.geoEnsureIndexes();
    }

    binUtils.disconnectDatabase();
    binUtils.log("All done", {
        success: true,
    });
    process.exit(0);
})();
