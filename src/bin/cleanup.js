const BinUtils = require("#lib/binUtils.js");

const binUtils = new BinUtils({});
binUtils.printLogo();
binUtils.cleanUp();
binUtils.log("All done", {
    success: true,
});
