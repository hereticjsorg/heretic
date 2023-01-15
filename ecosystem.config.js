const path = require("path");

const systemConfig = require(path.resolve(__dirname, "etc", "system.js"));

module.exports = {
    apps: [{
        name: systemConfig.id,
        script: path.resolve(__dirname, "dist/server.js"),
        watch: false,
        exec_mode: "cluster",
        instances: 1,
        time: false,
        error_file: path.resolve(__dirname, "logs", `${systemConfig.id}_error.log`),
        out_file: path.resolve(__dirname, "logs", `${systemConfig.id}_out.log`),
        log_file: false,
        merge_logs: true,
    }]
};
