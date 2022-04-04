const path = require("path");

const siteMeta = require(path.resolve(__dirname, "etc", "meta.json"));

module.exports = {
    apps: [{
        id: siteMeta.id,
        script: "./dist/server.js",
        watch: false,
        exec_mode: "cluster",
        instances: 1,
        time: false,
        error_file: path.resolve(__dirname, "logs", `${siteMeta.id}_error.log`),
        out_file: path.resolve(__dirname, "logs", `${siteMeta.id}_out.log`),
        log_file: false,
        merge_logs: true,
    }]
};
