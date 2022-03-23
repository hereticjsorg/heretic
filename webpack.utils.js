const path = require("path");
const fs = require("fs-extra");

module.exports = class {
    constructor() {
        fs.ensureDirSync(path.resolve(__dirname, "src", "build"));
        fs.removeSync(path.resolve(__dirname, "dist"));
        this.languages = fs.readJSONSync(path.resolve(__dirname, "etc", "languages.json"));
    }

    generateI18nLoader() {
        fs.writeFileSync(path.resolve(__dirname, "src", "build", "i18n-loader.js"), `module.exports = {
    loadLanguageFile: async lang => {
        let translationCore;
        let translationUser;
        switch (lang) {
${Object.keys(this.languages).map(l => `        case "${l}":
            translationCore = await import(/* webpackChunkName: "lang-core-${l}" */ "../translations/core/${l}.json");
            translationUser = await import(/* webpackChunkName: "lang-${l}" */ "../translations/${l}.json");
            break;
`).join("")}        default:
            return null;
        }
        return {
            ...translationCore,
            ...translationUser
        };
    },
};\n`, "utf8");
    }

    generatePagesLoader() {
        fs.writeFileSync(path.resolve(__dirname, "src", "build", "pages-loader.js"), `module.exports = {
    loadComponent: async route => {
        switch (route) {
${fs.readdirSync(path.resolve(__dirname, "src", "pages")).map(p => `        case "${p}":
            return import(/* webpackChunkName: "page.${p}" */ "../pages/${p}/index.marko");
`).join("")}        default:
            return import(/* webpackChunkName: "page.404" */ "../errors/404/index.marko");
        }
    },
};\n`, "utf8");
    }

    generatePagesBuildConfigs() {
        const pagesMeta = [];
        fs.readdirSync(path.resolve(__dirname, "src", "pages")).map(p => {
            try {
                const meta = fs.readJSONSync(path.resolve(__dirname, "src", "pages", p, "meta.json"));
                pagesMeta.push(meta);
            } catch {
                // OK
            }
        });
        const routes = [];
        const translations = [];
        pagesMeta.map(i => {
            routes.push({
                id: i.id,
                path: i.path,
            });
            translations.push({
                id: i.id,
                title: i.title,
                description: i.description,
            });
        });
        fs.writeJSONSync(path.resolve(__dirname, "src", "build", "routes.json"), routes, {
            spaces: "\t",
        });
        fs.writeJSONSync(path.resolve(__dirname, "src", "build", "translations.json"), translations, {
            spaces: "\t",
        });
    }
};
