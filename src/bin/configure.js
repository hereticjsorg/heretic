/* eslint-disable no-console */
const commandLineArgs = require("command-line-args");
const BinUtils = require("./binUtils");

const options = commandLineArgs([{
    name: "force",
    alias: "f",
    type: Boolean,
}]);

const binUtils = new BinUtils(options);
binUtils.ensureDirectories();
binUtils.copyFiles();
binUtils.generateSecureConfig();
binUtils.writeNavigationConfig();
binUtils.writeUserTranslationData();
binUtils.initCorePagesMeta();
binUtils.log("All done", {
    success: true,
});
