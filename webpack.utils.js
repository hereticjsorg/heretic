const path = require("path");
const fs = require("fs-extra");

module.exports = class {
    constructor(production) {
        fs.removeSync(path.resolve(__dirname, "dist/public/heretic"));
        fs.removeSync(path.resolve(__dirname, "dist/server.js"));
        fs.removeSync(path.resolve(__dirname, "src", "build"));
        fs.ensureDirSync(path.resolve(__dirname, "src", "build"));
        fs.ensureDirSync(path.resolve(__dirname, "logs"));
        fs.ensureDirSync(path.resolve(__dirname, "dist"));
        fs.ensureDirSync(path.resolve(__dirname, "dist", "tmp"));
        this.languages = fs.readJSONSync(path.resolve(__dirname, "src", "config", "languages.json"));
        this.config = fs.readJSONSync(path.resolve(__dirname, "etc", "system.json"));
        this.meta = fs.readJSONSync(path.resolve(__dirname, "etc", "meta.json"));
        this.production = production;
    }

    generateI18nLoader() {
        fs.writeFileSync(path.resolve(__dirname, "src", "build", "i18n-loader.js"), `module.exports = {
    loadLanguageFile: async lang => {
        let translationCore;
        // eslint-disable-next-line prefer-const
        let translationUser = {};
        switch (lang) {
${Object.keys(this.languages).map(l => `        case "${l}":
            translationCore = await import(/* webpackChunkName: "lang-core-${l}" */ "../translations/core/${l}.json");${fs.existsSync(path.resolve(__dirname, "src", "translations", "user", `${l}.json`)) ? `
            translationUser = await import(/* webpackChunkName: "lang-${l}" */ "../translations/user/${l}.json");` : ""}
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
        const routes = fs.readJSONSync(path.resolve(__dirname, "src", "build", "routes.json"));
        fs.writeFileSync(path.resolve(__dirname, "src", "build", "pages-loader.js"), `module.exports = {
    loadComponent: async route => {
        switch (route) {
${routes.map(r => `        case "${r.id}":
            return import(/* webpackChunkName: "page.${r.id}" */ "../pages/${r.dir}/index.marko");
`).join("")}        default:
            return import(/* webpackChunkName: "page.404" */ "../errors/404/index.marko");
        }
    },
};\n`, "utf8");
    }

    generatePagesBuildConfigs() {
        const pagesMeta = [];
        fs.readdirSync(path.resolve(__dirname, "src", "pages")).filter(p => !p.match(/^\./)).map(p => {
            try {
                const metaRoot = fs.readJSONSync(path.resolve(__dirname, "src", "pages", p, "meta.json"));
                if (Array.isArray(metaRoot)) {
                    for (const mp of metaRoot) {
                        try {
                            const metaSub = fs.readJSONSync(path.resolve(__dirname, "src", "pages", p, mp, "meta.json"));
                            pagesMeta.push({
                                ...metaSub,
                                dir: `${p}/${mp}`
                            });
                        } catch {
                            // Ignore
                        }
                    }
                } else {
                    pagesMeta.push({
                        ...metaRoot,
                        dir: p
                    });
                }
            } catch {
                // Ignore
            }
        });
        const routes = [];
        const translations = [];
        pagesMeta.map(i => {
            routes.push({
                id: i.id,
                path: i.path,
                dir: i.dir,
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

    generateI18nNavigation() {
        const titles = {};
        const userTranslations = {};
        Object.keys(this.languages).map(l => {
            titles[l] = {};
            userTranslations[l] = {};
            try {
                userTranslations[l] = fs.readJSONSync(path.resolve(__dirname, "src", "translations", "user", `${l}.json`));
            } catch {
                // Ignore
            }
        });
        const navigation = fs.readJSONSync(path.resolve(__dirname, "src", "config", "navigation.json"));
        navigation.routes.map(r => {
            const id = typeof r === "string" ? r : r.id;
            let meta = {
                title: {},
            };
            try {
                meta = fs.readJSONSync(path.resolve(__dirname, "src", "pages", id, "meta.json"));
            } catch {
                // Ignore
            }
            Object.keys(titles).map(lang => titles[lang][id] = meta.title[lang] || userTranslations[lang][id] || "");
        });
        fs.writeJSONSync(path.resolve(__dirname, "src", "build", "i18n-navigation.json"), titles, {
            spaces: "\t"
        });
    }

    generateSitemap() {
        const sitemapData = [];
        const routes = fs.readJSONSync(path.resolve(__dirname, "src", "build", "routes.json"));
        for (const r of routes) {
            try {
                const sitemap = fs.readJSONSync(path.resolve(__dirname, "src", "pages", r.dir, "sitemap.json"));
                if (sitemap.include) {
                    const entry = {
                        loc: `${this.meta.url}${r.path}`,
                    };
                    if (sitemap.lastmod) {
                        try {
                            const stats = fs.statSync(path.resolve(__dirname, "src", "pages", r.dir, "content", "index.marko"));
                            entry.lastmod = new Date(stats.mtime).toISOString().slice(0, 10);
                        } catch (e) {
                            entry.lastmod = new Date().toISOString().slice(0, 10);
                        }
                    }
                    if (sitemap.changefreq) {
                        entry.changefreq = sitemap.changefreq;
                    }
                    if (sitemap.priority) {
                        entry.priority = sitemap.priority;
                    }
                    sitemapData.push(entry);
                }
            } catch {
                // Ignore
            }
        }
        if (sitemapData.length) {
            let sitemapXML = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
            sitemapData.map(i => {
                sitemapXML += `<url>`;
                Object.keys(i).map(t => {
                    sitemapXML += `<${t}>${i[t]}</${t}>`;
                });
                sitemapXML += `</url>`;
            });
            sitemapXML += `</urlset>`;
            fs.writeFileSync(path.resolve(__dirname, "src", "static", "sitemap.xml"), sitemapXML, "utf8");
        }
    }

    generateManifest() {
        const language = Object.keys(this.languages)[0];
        const manifest = fs.readJSONSync(path.resolve(__dirname, "src", "static", "site.webmanifest"));
        manifest.name = this.meta.title[language];
        manifest.short_name = this.meta.shortTitle[language];
        manifest.description = this.meta.description[language];
        manifest.id = this.meta.id;
        fs.writeJSONSync(path.resolve(__dirname, "src", "static", "site.webmanifest"), manifest, this.production ? {} : {
            spaces: "\t",
        });
    }

    generateServerData() {
        const serverData = {
            production: this.production,
        };
        fs.writeJSONSync(path.resolve(__dirname, "src", "build", "server.json"), serverData, {
            spaces: "\t"
        });
    }

    generateLangSwitchComponents() {
        const routes = fs.readJSONSync(path.resolve(__dirname, "src", "build", "routes.json"));
        let langSwitchMarko = "";
        Object.keys(this.languages).map(lang => langSwitchMarko += `<if(out.global.language === "${lang}")>\n    <lang-${lang}/>\n</if>\n`);
        for (const r of routes) {
            if (fs.existsSync(path.resolve(__dirname, "src", "pages", r.dir, "content"))) {
                const meta = fs.readJSONSync(path.resolve(__dirname, "src", "pages", r.dir, "meta.json"));
                if (meta.langSwitchComponent) {
                    fs.removeSync(path.resolve(__dirname, "src", "pages", r.dir, "content", "lang-switch"));
                    fs.ensureDirSync(path.resolve(__dirname, "src", "pages", r.dir, "content", "lang-switch"));
                    fs.writeFileSync(path.resolve(__dirname, "src", "pages", r.dir, "content", "lang-switch", "marko.json"), `{"tags-dir": ["../"]}`);
                    fs.writeFileSync(path.resolve(__dirname, "src", "pages", r.dir, "content", "lang-switch", "index.marko"), langSwitchMarko);
                }
            }
        }
    }

    generateListAPI() {
        const apiModules = fs.readdirSync(path.resolve(__dirname, "src", "api"));
        fs.writeJSONSync(path.resolve(__dirname, "src", "build", "api.json"), apiModules, {
            spaces: "\t"
        });
    }

    copyDataDir() {
        fs.copySync(path.resolve(__dirname, "src", "data"), path.resolve(__dirname, "dist", "data"));
    }
};
