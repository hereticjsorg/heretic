const path = require("path");
const fs = require("fs-extra");

module.exports = class {
    constructor() {
        fs.removeSync(path.resolve(__dirname, "dist"));
        fs.removeSync(path.resolve(__dirname, "src", "build"));
        fs.ensureDirSync(path.resolve(__dirname, "src", "build"));
        this.languages = fs.readJSONSync(path.resolve(__dirname, "etc", "languages.json"));
        this.config = fs.readJSONSync(path.resolve(__dirname, "etc", "config.json"));
    }

    generateI18nLoader() {
        fs.writeFileSync(path.resolve(__dirname, "src", "build", "i18n-loader.js"), `module.exports = {
    loadLanguageFile: async lang => {
        let translationCore;
        // eslint-disable-next-line prefer-const
        let translationUser = {};
        switch (lang) {
${Object.keys(this.languages).map(l => `        case "${l}":
            translationCore = await import(/* webpackChunkName: "lang-core-${l}" */ "../translations/core/${l}.json");${fs.existsSync(path.resolve(__dirname, "src", "translations", `${l}.json`)) ? `
            translationUser = await import(/* webpackChunkName: "lang-${l}" */ "../translations/${l}.json");` : ""}
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
                // Ignore
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

    generateI18nNavigation() {
        const titles = {};
        Object.keys(this.languages).map(l => titles[l] = {});
        const navigation = fs.readJSONSync(path.resolve(__dirname, "etc", "navigation.json"));
        navigation.routes.map(r => {
            const meta = fs.readJSONSync(path.resolve(__dirname, "src", "pages", r, "meta.json"));
            Object.keys(titles).map(lang => titles[lang][r] = meta.title[lang]);
        });
        fs.writeJSONSync(path.resolve(__dirname, "src", "build", "i18n-navigation.json"), titles, {
            spaces: "\t"
        });
    }

    generateSitemap() {
        const sitemapData = [];
        const routes = fs.readJSONSync(path.resolve(__dirname, "src", "build", "routes.json"));
        fs.readdirSync(path.resolve(__dirname, "src", "pages")).map(p => {
            try {
                const sitemap = fs.readJSONSync(path.resolve(__dirname, "src", "pages", p, "sitemap.json"));
                if (sitemap.include) {
                    const route = routes.find(r => r.id === p);
                    const entry = {
                        loc: `${this.config.url}${route.path}`,
                    };
                    if (sitemap.lastmod) {
                        try {
                            const stats = fs.statSync(path.resolve(__dirname, "src", "pages", p, "content", "index.marko"));
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
        });
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
};
