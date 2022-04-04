/* eslint-disable no-console */
const fs = require("fs-extra");
const path = require("path");
const commandLineArgs = require("command-line-args");

let options;
try {
    options = commandLineArgs([{
        name: "addPage",
        alias: "a",
        type: String
    }, {
        name: "removePage",
        alias: "r",
        type: String
    }, {
        name: "addLanguage",
        alias: "t",
        type: String
    }, {
        name: "removeLanguage",
        alias: "d",
        type: String
    }, {
        name: "navigation",
        alias: "n",
        type: Boolean
    }]);
} catch (e) {
    console.error(e.message);
    process.exit(1);
}

const addPageFunc = (id, navigation) => {
    if (!id || !id.match(/^[a-z0-9_-]+$/i)) {
        console.error("Invalid page ID, use latin characters, numbers and '-', '_' chars only");
        process.exit(1);
    }
    if (fs.existsSync(path.resolve(__dirname, "..", "pages", id))) {
        console.error(`Page '${id}' already exists`);
        process.exit(1);
    }
    console.log(`Creating page '${id}...`);
    fs.copySync(path.resolve(__dirname, "..", "pages", ".blank"), path.resolve(__dirname, "..", "pages", id));
    const pageMeta = fs.readJSONSync(path.resolve(__dirname, "..", "pages", id, "meta.json"));
    pageMeta.id = id;
    pageMeta.path = `/${id}`;
    fs.writeJSONSync(path.resolve(__dirname, "..", "pages", id, "meta.json"), pageMeta, {
        spaces: "\t",
    });
    if (navigation) {
        const navJson = fs.readJSONSync(path.resolve(__dirname, "..", "config", "navigation.json"));
        if (navJson.routes.indexOf(id) === -1) {
            console.log("Adding navbar item...");
            navJson.routes.push(id);
            if (!navJson.home) {
                navJson.home = id;
            }
            fs.writeJSONSync(path.resolve(__dirname, "..", "config", "navigation.json"), navJson, {
                spaces: "\t"
            });
        }
    }
    console.log("All done.\n");
};

const removePageFunc = id => {
    if (!id || !id.match(/^[a-z0-9_-]+$/i)) {
        console.error("Invalid page ID, use latin characters, numbers and '-', '_' chars only");
        process.exit(1);
    }
    if (!fs.existsSync(path.resolve(__dirname, "..", "pages", id))) {
        console.error(`Page '${id}' doesn't exists`);
        process.exit(1);
    }
    console.log(`Removing page '${id}...`);
    fs.removeSync(path.resolve(__dirname, "..", "pages", id));
    const navJson = fs.readJSONSync(path.resolve(__dirname, "..", "config", "navigation.json"));
    if (navJson.routes.indexOf(id) >= 0) {
        console.log("Removing page from navbar...");
        navJson.routes = navJson.routes.filter(r => r !== id);
        navJson.home = navJson.home === id ? "" : navJson.home;
        fs.writeJSONSync(path.resolve(__dirname, "..", "config", "navigation.json"), navJson, {
            spaces: "\t"
        });
    }
    console.log("All done.\n");
};

const addLanguageFunc = data => {
    const [id, name] = data.split(/:/);
    if (!id || !id.match(/^[a-z]{2}-[a-z]{2}$/i)) {
        console.error("Invalid language ID, use the following format: xx-xx");
        process.exit(1);
    }
    if (!name) {
        console.error("Please specify language ID and name, example: de-de:Deutsch");
        process.exit(1);
    }
    const languageJson = fs.readJSONSync(path.resolve(__dirname, "..", "config", "languages.json"));
    if (Object.keys(languageJson).indexOf(id) >= 0) {
        console.error(`Language '${id}' already exists`);
        process.exit(1);
    }
    console.log(`Adding new language to languages.json: ${id} (${name})...`);
    languageJson[id] = name;
    fs.writeJSONSync(path.resolve(__dirname, "..", "config", "languages.json"), languageJson, {
        spaces: "\t"
    });
    console.log("Modifying existing pages...");
    fs.readdirSync(path.resolve(__dirname, "..", "pages")).map(p => {
        const metaJson = fs.readJSONSync(path.resolve(__dirname, "..", "pages", p, "meta.json"));
        metaJson.title[id] = metaJson.title[id] || "";
        metaJson.description[id] = metaJson.description[id] || "";
        fs.writeJSONSync(path.resolve(__dirname, "..", "pages", p, "meta.json"), metaJson, {
            spaces: "\t"
        });
        fs.ensureDirSync(path.resolve(__dirname, "..", "pages", p, "content", `lang-${id}`));
        fs.writeFileSync(path.resolve(__dirname, "..", "pages", p, "content", `lang-${id}`, "index.marko"), `<div>${name}</div>`, "utf8");
    });
    const metaJson = fs.readJSONSync(path.resolve(__dirname, "..", "..", "etc", "meta.json"));
    metaJson.title[id] = metaJson.title[id] || "";
    metaJson.shortTitle[id] = metaJson.shortTitle[id] || "";
    metaJson.description[id] = metaJson.description[id] || "";
    fs.writeJSONSync(path.resolve(__dirname, "..", "..", "etc", "meta.json"), metaJson, {
        spaces: "\t"
    });
    const transCoreJson = fs.readJSONSync(path.resolve(__dirname, "..", "translations", "core", `${Object.keys(languageJson)[0]}.json`));
    fs.writeJSONSync(path.resolve(__dirname, "..", "translations", "core", `${id}.json`), transCoreJson, {
        spaces: "\t"
    });
    if (fs.existsSync(path.resolve(__dirname, "..", "translations", "user"))) {
        const transUserJson = fs.readJSONSync(path.resolve(__dirname, "..", "translations", "user", `${Object.keys(languageJson)[0]}.json`));
        fs.writeJSONSync(path.resolve(__dirname, "..", "translations", "user", `${id}.json`), transUserJson, {
            spaces: "\t"
        });
    }
    console.log("All done.\n");
};

const removeLanguageFunc = id => {
    if (!id || !id.match(/^[a-z]{2}-[a-z]{2}$/i)) {
        console.error("Invalid language ID, use the following format: xx-xx");
        process.exit(1);
    }
    const languageJson = fs.readJSONSync(path.resolve(__dirname, "..", "config", "languages.json"));
    if (Object.keys(languageJson).indexOf(id) === -1) {
        console.error(`Language '${id}' doesn't exists`);
        process.exit(1);
    }
    console.log(`Removing language from languages.json: ${id}...`);
    delete languageJson[id];
    fs.writeJSONSync(path.resolve(__dirname, "..", "config", "languages.json"), languageJson, {
        spaces: "\t"
    });
    console.log("Removing language from existing pages...");
    fs.readdirSync(path.resolve(__dirname, "..", "pages")).map(p => {
        const metaJson = fs.readJSONSync(path.resolve(__dirname, "..", "pages", p, "meta.json"));
        delete metaJson.title[id];
        delete metaJson.description[id];
        fs.writeJSONSync(path.resolve(__dirname, "..", "pages", p, "meta.json"), metaJson, {
            spaces: "\t"
        });
        if (fs.existsSync(path.resolve(__dirname, "..", "pages", p, "content", `lang-${id}`))) {
            fs.removeSync(path.resolve(__dirname, "..", "pages", p, "content", `lang-${id}`));
        }
    });
    const metaJson = fs.readJSONSync(path.resolve(__dirname, "..", "..", "etc", "meta.json"));
    delete metaJson.title[id];
    delete metaJson.shortTitle[id];
    delete metaJson.description[id];
    fs.writeJSONSync(path.resolve(__dirname, "..", "..", "etc", "meta.json"), metaJson, {
        spaces: "\t"
    });
    if (fs.existsSync(path.resolve(__dirname, "..", "translations", "core", `${id}.json`))) {
        fs.removeSync(path.resolve(__dirname, "..", "translations", "core", `${id}.json`));
    }
    if (fs.existsSync(path.resolve(__dirname, "..", "translations", "user", `${id}.json`))) {
        fs.removeSync(path.resolve(__dirname, "..", "translations", "user", `${id}.json`));
    }
    console.log("All done.\n");
};

if (!Object.keys(options).length) {
    console.log(`Usage:\n\nnpm run cli -- --addPage <id> [--navigation] - create a new page (optionally add to navbar)
               --removePage <id> - delete existing page
               --addLanguage <id:name> - add new language (example: de-de:Deutsch)
               --removeLanguage <id> - delete existing language\n`);
    process.exit(0);
}

if (options.addPage !== undefined) {
    addPageFunc(options.addPage, !!options.navigation);
}

if (options.removePage !== undefined) {
    removePageFunc(options.removePage);
}

if (options.addLanguage !== undefined) {
    addLanguageFunc(options.addLanguage);
}

if (options.removeLanguage !== undefined) {
    removeLanguageFunc(options.removeLanguage);
}
