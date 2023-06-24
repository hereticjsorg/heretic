const path = require("path");

const systemConfig = require(path.resolve(__dirname, "etc", "system.js"));
const logFileName = `${systemConfig.id}.log`;

module.exports = {
    logFileName: `${systemConfig.id}.log`,
    apps: [{
        name: systemConfig.id,
        script: path.resolve(__dirname, "dist/server.js"),
        watch: false,
        exec_mode: "cluster",
        instances: 1,
        time: false,
        error_file: false,
        out_file: false,
        log_file: path.resolve(__dirname, "logs", logFileName),
        merge_logs: true,
    }]
};
