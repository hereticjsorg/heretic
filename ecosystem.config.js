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
        error_file: false,
        out_file: false,
        log_file: path.resolve(__dirname, "logs", `${systemConfig.id}.log`),
        merge_logs: true,
    }]
};
