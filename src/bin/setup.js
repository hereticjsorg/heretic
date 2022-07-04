/* eslint-disable no-console */
const fs = require("fs-extra");
const path = require("path");
const commandLineArgs = require("command-line-args");
const {
    v4: uuidv4
} = require("uuid");
const crypto = require("crypto");

const languages = Object.keys(require(path.resolve(__dirname, "..", "config", "languages")));

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
    console.log(`Note: use --defaults parameter to create default modules and navigation`);
}

// Reading configuration templates

const configMeta = fs.readJSONSync(path.resolve(__dirname, "..", "core", "defaults", "meta.json"));
const configSystem = fs.readJSONSync(path.resolve(__dirname, "..", "core", "defaults", "system.json"));
const configNavigation = fs.readJSONSync(path.resolve(__dirname, "..", "core", "defaults", "navigation.json"));

// Generate Secret

configSystem.secret = crypto.createHmac("sha256", uuidv4()).update(uuidv4()).digest("hex");

// Ensure that required directories exist

fs.ensureDirSync(path.resolve(__dirname, "..", "modules"));
fs.ensureDirSync(path.resolve(__dirname, "..", "..", "etc"));
fs.ensureDirSync(path.resolve(__dirname, "..", "translations", "user"));

// If there is an option to copy defaults...

if (options.defaults) {
    // Copy src/modules/home module
    if (!fs.existsSync(path.resolve(__dirname, "..", "modules", "home")) || options.force) {
        fs.copySync(path.resolve(__dirname, "..", "core", "defaults", "home"), path.resolve(__dirname, "..", "modules", "home"));
    } else {
        console.log(`Warning: skipping src/modules/home, use --force parameter to override`);
    }
    // Copy src/modules/license module
    if (!fs.existsSync(path.resolve(__dirname, "..", "modules", "license")) || options.force) {
        fs.copySync(path.resolve(__dirname, "..", "core", "defaults", "license"), path.resolve(__dirname, "..", "modules", "license"));
    } else {
        console.log(`Warning: skipping src/modules/license, use --force parameter to override`);
    }
} else {
    // There are no default routes otherwise
    configNavigation.routes = [];
}

// Copy src/view template

if (!fs.existsSync(path.resolve(__dirname, "..", "view")) || options.force) {
    fs.copySync(path.resolve(__dirname, "..", "core", "defaults", "view"), path.resolve(__dirname, "..", "view"));
} else {
    console.log(`Warning: skipping src/view, use --force parameter to override`);
}

// Copy blank module template

if (!fs.existsSync(path.resolve(__dirname, "..", "modules", ".blank")) || options.force) {
    fs.copySync(path.resolve(__dirname, "..", "core", "defaults", ".blank"), path.resolve(__dirname, "..", "modules", ".blank"));
} else {
    console.log(`Warning: skipping modules/.blank, use --force parameter to override`);
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

// Create empty translation files

for (const lang of languages) {
    if (!fs.existsSync(path.resolve(__dirname, "..", "translations", "user", `${lang}.json`)) || options.force) {
        fs.writeJSONSync(path.resolve(__dirname, "..", "translations", "user", `${lang}.json`), {}, {
            spaces: "\t"
        });
    } else {
        console.log(`Warning: skipping src/translation/user/${lang}.json, use --force parameter to override`);
    }
}

// Done

console.log("All done.\n");
