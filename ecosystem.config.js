const path = require("path");

const systemConfig = require(path.resolve(__dirname, "site/etc/system.js"));
const logFileName = `${systemConfig.id}.log`;

module.exports = {
    logFileName,
    apps: [{
        name: systemConfig.id,
        script: path.resolve(__dirname, "dist/server.js"),
        watch: false,
        exec_mode: "cluster",
        instances: 1,
        time: false,
        error_file: "/dev/null",
        out_file: "/dev/null",
        log_file: path.resolve(__dirname, "logs", logFileName),
        merge_logs: true,
    }]
};
