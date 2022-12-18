const commandLineArgs = require("command-line-args");
const BinUtils = require("./binUtils");
const cliData = require("./cliData");

const binUtils = new BinUtils({});
let options;
try {
    options = commandLineArgs(cliData.args);
} catch (e) {
    binUtils.log(e.message);
    process.exit(1);
}

binUtils.printLogo();

(async () => {
    if (!Object.keys(options).length) {
        binUtils.log(`Usage:\n\nnpm run cli -- --addPage <id> [--addNavigation] - create a new page [add navigation]
               --removePage <id> - delete existing page
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

    if (options.addPage !== undefined) {
        binUtils.addPage(options.addPage, options.addNavigation);
    }

    if (options.removePage !== undefined) {
        binUtils.removePage(options.removePage);
    }

    if (options.addLanguage !== undefined) {
        const [id, name] = options.addLanguage.split(/:/);
        binUtils.addLanguage(id, name);
    }

    if (options.removeLanguage !== undefined) {
        binUtils.removeLanguage(options.removeLanguage);
    }

    if (options.resetPassword !== undefined) {
        binUtils.resetPassword(options.resetPassword);
    }

    if (options.createAdmin !== undefined) {
        binUtils.createAdmin();
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
})();
