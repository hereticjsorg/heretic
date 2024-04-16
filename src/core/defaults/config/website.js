const meta = require("./meta.json");

const config = {
    /*
        Website URL
    */
    url: "http://127.0.0.1:3001",
    /*
        Include website metadata, see meta.json file
    */
    ...meta,
};

module.exports = config;
