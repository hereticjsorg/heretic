/* eslint-disable no-console */
const commandLineArgs = require("command-line-args");
const BinUtils = require("#lib/binUtils.js");

const options = commandLineArgs([
    {
        name: "force",
        alias: "f",
        type: Boolean,
    },
    {
        name: "no-color",
        type: Boolean,
    },
]);

const binUtils = new BinUtils(options);
binUtils.printLogo();
binUtils.ensureDirectories();
binUtils.copyFiles();
binUtils.generateSecureConfig();
binUtils.writeNavigationConfig();
binUtils.writeUserTranslationData();
binUtils.log("All done.", {
    success: true,
});
