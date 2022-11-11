const BinUtils = require("./binUtils");

const binUtils = new BinUtils({});
binUtils.printLogo();
binUtils.cleanUp();
binUtils.log("All done", {
    success: true,
});
