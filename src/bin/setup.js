/* eslint-disable no-console */
const fs = require("fs-extra");
const path = require("path");
const commandLineArgs = require("command-line-args");

const options = commandLineArgs([{
    name: "defaults",
    alias: "d",
    type: Boolean
}, {
    name: "force",
    alias: "f",
    type: Boolean
}]);

// Print logo :-)

console.log(` _   _               _   _\n| | | |             | | (_)\n| |_| | ___ _ __ ___| |_ _  ___\n|  _  |/ _ \\ '__/ _ \\ __| |/ __|\n| | | |  __/ | |  __/ |_| | (__\n\\_| |_/\\___|_|  \\___|\\__|_|\\___|\n`);

console.log("Initializing configuration files and data...");
if (!options.defaults) {
    console.log(`Note: use --defaults parameter to create default pages and navigation`);
}

// Reading configuration templates

const configMeta = fs.readJSONSync(path.resolve(__dirname, "..", "defaults", "meta.json"));
const configSystem = fs.readJSONSync(path.resolve(__dirname, "..", "defaults", "system.json"));
const configNavigation = fs.readJSONSync(path.resolve(__dirname, "..", "defaults", "navigation.json"));

// Ensure that required directories exist

fs.ensureDirSync(path.resolve(__dirname, "..", "pages"));
fs.ensureDirSync(path.resolve(__dirname, "..", "..", "etc"));

// If there is an option to copy defaults...

if (options.defaults) {
    // Copy src/pages/home page
    if (!fs.existsSync(path.resolve(__dirname, "..", "pages", "home")) || options.force) {
        fs.copySync(path.resolve(__dirname, "..", "defaults", "home"), path.resolve(__dirname, "..", "pages", "home"));
    } else {
        console.log(`Warning: skipping src/pages/home, use --force parameter to override`);
    }
    // Copy src/pages/license page
    if (!fs.existsSync(path.resolve(__dirname, "..", "pages", "license")) || options.force) {
        fs.copySync(path.resolve(__dirname, "..", "defaults", "license"), path.resolve(__dirname, "..", "pages", "license"));
    } else {
        console.log(`Warning: skipping src/pages/license, use --force parameter to override`);
    }
} else {
    // There are no default routes otherwise
    configNavigation.routes = [];
}

// Copy src/view template

if (!fs.existsSync(path.resolve(__dirname, "..", "view")) || options.force) {
    fs.copySync(path.resolve(__dirname, "..", "defaults", "view"), path.resolve(__dirname, "..", "view"));
} else {
    console.log(`Warning: skipping src/view, use --force parameter to override`);
}

// Copy etc/meta.json configuration file

if (!fs.existsSync(path.resolve(__dirname, "..", "..", "etc", "meta.json")) || options.force) {
    fs.writeJSONSync(path.resolve(__dirname, "..", "..", "etc", "meta.json"), configMeta, {
        spaces: "\t"
    });
} else {
    console.log(`Warning: skipping etc/meta.json, use --force parameter to override`);
}

// Copy etc/system.json configuration file

if (!fs.existsSync(path.resolve(__dirname, "..", "..", "etc", "system.json")) || options.force) {
    fs.writeJSONSync(path.resolve(__dirname, "..", "..", "etc", "system.json"), configSystem, {
        spaces: "\t"
    });
} else {
    console.log(`Warning: skipping etc/system.json, use --force parameter to override`);
}

// Copy etc/navigation.json configuration file

if (!fs.existsSync(path.resolve(__dirname, "..", "..", "etc", "navigation.json")) || options.force) {
    fs.writeJSONSync(path.resolve(__dirname, "..", "config", "navigation.json"), configNavigation, {
        spaces: "\t"
    });
} else {
    console.log(`Warning: skipping etc/navigation.json, use --force parameter to override`);
}

// Done

console.log("\nAll done.\n");
