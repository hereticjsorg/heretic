/* eslint-disable no-console */
const BinUtils = require("./binUtils");

const binUtils = new BinUtils({});
// binUtils.cleanUp();
binUtils.addLanguage("de-de", "Deutsch");
console.log("All done.\n");
