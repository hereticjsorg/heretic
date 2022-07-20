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
        fs.writeFileSync(path.resolve(__dirname, "src", "build", "i18n-loader-core.js"), `module.exports = {
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
        const languageData = {
            ...translationCore,
            ...translationUser
        };
        delete languageData.default;
        return languageData;
    },
};\n`, "utf8");
        const modules = fs.readdirSync(path.resolve(__dirname, "src", "modules")).filter(p => !p.match(/^\./));
        const translatedModules = [];
        for (const module of modules) {
            if (fs.existsSync(path.resolve(__dirname, "src", "modules", module, "translations"))) {
                translatedModules.push(module);
                fs.writeFileSync(path.resolve(__dirname, "src", "build", `i18n-loader-${module}.js`), `module.exports = {
    loadLanguageFile: async lang => {
        let translationModule = {};
        switch (lang) {
${Object.keys(this.languages).map(l => `        case "${l}":
            translationModule = await import(/* webpackChunkName: "lang-${module}-${l}" */ "../modules/${module}/translations/${l}.json");
            break;
`).join("")}        default:
            return null;
        }
        const languageData = {
            ...translationModule,
        };
        delete languageData.default;
        return languageData;
    },
};\n`, "utf8");
            }
        }
        fs.writeJSONSync(path.resolve(__dirname, "src", "build", "translated-modules.json"), translatedModules, {
            spaces: "\t"
        });
        const modulesCore = fs.readdirSync(path.resolve(__dirname, "src", "core", "modules")).filter(p => !p.match(/^\./));
        const translatedModulesCore = [];
        for (const module of modulesCore) {
            if (fs.existsSync(path.resolve(__dirname, "src", "core", "modules", module, "translations"))) {
                translatedModulesCore.push(module);
                fs.writeFileSync(path.resolve(__dirname, "src", "build", `i18n-loader-${module}.js`), `module.exports = {
    loadLanguageFile: async lang => {
        let translationModule = {};
        switch (lang) {
${Object.keys(this.languages).map(l => `        case "${l}":
            translationModule = await import(/* webpackChunkName: "lang-${module}-${l}" */ "../core/modules/${module}/translations/${l}.json");
            break;
`).join("")}        default:
            return null;
        }
        const languageData = {
            ...translationModule,
        };
        delete languageData.default;
        return languageData;
    },
};\n`, "utf8");
            }
        }
        fs.writeJSONSync(path.resolve(__dirname, "src", "build", "translated-modules-core.json"), translatedModulesCore, {
            spaces: "\t"
        });
    }

    generateModulesLoader() {
        const routes = fs.readJSONSync(path.resolve(__dirname, "src", "build", "routes.json"));
        fs.writeFileSync(path.resolve(__dirname, "src", "build", "module-loader.js"), `module.exports = {
    loadComponent: async route => {
        switch (route) {
${routes.map(r => `        case "${r.id}":
            return import(/* webpackChunkName: "module.${r.id}" */ "../modules/${r.dir}/frontend/index.marko");
`).join("")}        default:
            return import(/* webpackChunkName: "module.404" */ "../core/errors/404/index.marko");
        }
    },
};\n`, "utf8");
        const routesAdmin = fs.readJSONSync(path.resolve(__dirname, "src", "build", "routes-admin.json"));
        fs.writeFileSync(path.resolve(__dirname, "src", "build", "module-admin-loader.js"), `module.exports = {
    loadComponent: async route => {
        switch (route) {
${routesAdmin.map(r => `        case "${r.id}":
            return import(/* webpackChunkName: "module.${r.id}" */ "../${r.core ? "core/" : ""}modules/${r.dir}/admin/index.marko");
`).join("")}        default:
            return import(/* webpackChunkName: "module.404" */ "../core/errors/404/index.marko");
        }
    },
};\n`, "utf8");
    }

    generateModulesBuildConfigs() {
        const modulesMeta = [];
        const modulesAdminMeta = [];
        fs.readdirSync(path.resolve(__dirname, "src", "core", "modules")).filter(p => !p.match(/^\./)).map(p => {
            try {
                const metaAdmin = fs.readJSONSync(path.resolve(__dirname, "src", "core", "modules", p, "admin.json"));
                modulesAdminMeta.push({
                    ...metaAdmin,
                    dir: p,
                    core: true,
                });
            } catch {
                // Ignore
            }
        });
        fs.readdirSync(path.resolve(__dirname, "src", "modules")).filter(p => !p.match(/^\./)).map(p => {
            try {
                const metaRoot = fs.readJSONSync(path.resolve(__dirname, "src", "modules", p, "module.json"));
                if (Array.isArray(metaRoot)) {
                    for (const mp of metaRoot) {
                        try {
                            const metaSub = fs.readJSONSync(path.resolve(__dirname, "src", "modules", p, mp, "module.json"));
                            modulesMeta.push({
                                ...metaSub,
                                dir: `${p}/${mp}`
                            });
                        } catch {
                            // Ignore
                        }
                        if (fs.existsSync(path.resolve(__dirname, "src", "modules", p, mp, "admin.json"))) {
                            try {
                                const metaAdmin = fs.readJSONSync(path.resolve(__dirname, "src", "modules", p, mp, "admin.json"));
                                modulesAdminMeta.push({
                                    ...metaAdmin,
                                    dir: `${p}/${mp}`
                                });
                            } catch {
                                // Ignore
                            }
                        }
                    }
                } else {
                    modulesMeta.push({
                        ...metaRoot,
                        dir: p
                    });
                    if (fs.existsSync(path.resolve(__dirname, "src", "modules", p, "admin.json"))) {
                        try {
                            const metaAdmin = fs.readJSONSync(path.resolve(__dirname, "src", "modules", p, "admin.json"));
                            modulesAdminMeta.push({
                                ...metaAdmin,
                                dir: p
                            });
                        } catch {
                            // Ignore
                        }
                    }
                }
            } catch {
                // Ignore
            }
        });
        const routes = [];
        const translations = [];
        modulesMeta.map(i => {
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
        const routesAdmin = [];
        const translationsAdmin = [];
        modulesAdminMeta.map(i => {
            routesAdmin.push({
                id: i.id,
                path: `${this.config.routes.admin}${i.path}`,
                dir: i.dir,
                core: i.core,
            });
            translationsAdmin.push({
                id: i.id,
                title: i.title,
            });
        });
        fs.writeJSONSync(path.resolve(__dirname, "src", "build", "routes-admin.json"), routesAdmin, {
            spaces: "\t",
        });
        fs.writeJSONSync(path.resolve(__dirname, "src", "build", "translations-admin.json"), translationsAdmin, {
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
                meta = fs.readJSONSync(path.resolve(__dirname, "src", "modules", id, "module.json"));
            } catch {
                // Ignore
            }
            Object.keys(titles).map(lang => titles[lang][id] = meta.title[lang] || userTranslations[lang][id] || "");
        });
        fs.writeJSONSync(path.resolve(__dirname, "src", "build", "i18n-navigation.json"), titles, {
            spaces: "\t"
        });
        const navigationAdmin = fs.readJSONSync(path.resolve(__dirname, "src", "config", "navigation-admin.json"));
        navigationAdmin.map(id => {
            let meta;
            try {
                meta = fs.readJSONSync(path.resolve(__dirname, "src", "modules", id, "admin.json"));
            } catch {
                // Ignore
            }
            if (!meta) {
                try {
                    meta = fs.readJSONSync(path.resolve(__dirname, "src", "core", "modules", id, "admin.json"));
                } catch {
                    // Ignore
                }
            }
            if (!meta) {
                meta = {
                    title: ""
                };
            }
            Object.keys(titles).map(lang => titles[lang][id] = meta.title[lang] || userTranslations[lang][id] || "");
        });
        fs.writeJSONSync(path.resolve(__dirname, "src", "build", "i18n-navigation-admin.json"), titles, {
            spaces: "\t"
        });
    }

    generateAdminIconsLoader() {
        const navigationAdmin = fs.readJSONSync(path.resolve(__dirname, "src", "config", "navigation-admin.json"));
        const icons = [];
        const modules = {};
        for (const id of navigationAdmin) {
            try {
                const meta = fs.readJSONSync(path.resolve(__dirname, "src", "modules", id, "admin.json"));
                if (meta.icon) {
                    icons.push(meta.icon);
                    modules[meta.icon] = id;
                }
            } catch {
                // Ignore
            }
            try {
                const meta = fs.readJSONSync(path.resolve(__dirname, "src", "core", "modules", id, "admin.json"));
                if (meta.icon) {
                    icons.push(meta.icon);
                    modules[meta.icon] = id;
                }
            } catch {
                // Ignore
            }
        }
        const code = `${icons.length ? `${icons.map(icon => `import { ${icon} as ${modules[icon]} } from "@mdi/js"`).join("\n")}` : ""}${icons.length ? "\n" : ""}
<div
    class=("hr-icon-admin-wrap " + (input.css || ""))
    style={
        "margin-right": input.marginRight || "0"
    }>
    <svg
        style={
            top: input.marginTop || "0",
            width: input.width || "24",
            height: input.height || "24"
        }
        class="hr-icon-admin"
        viewBox="0 0 24 24"
        width=(input.width || "24")
        height=(input.width || "24")
        xmlns="http://www.w3.org/2000/svg">\n${icons.map(icon => `        <if(input.id === "${modules[icon]}")>
            <path d=${modules[icon]}/>
        </if>`).join("\n")}\n    </svg>
</div>
`;
        fs.writeFileSync(path.resolve(__dirname, "src", "core", "components", "icon-admin", "index.marko"), code);
    }

    generateSitemap() {
        const sitemapData = [];
        const routes = fs.readJSONSync(path.resolve(__dirname, "src", "build", "routes.json"));
        for (const r of routes) {
            try {
                const sitemap = fs.readJSONSync(path.resolve(__dirname, "src", "modules", r.dir, "sitemap.json"));
                if (sitemap.include) {
                    const entry = {
                        loc: `${this.meta.url}${r.path}`,
                    };
                    if (sitemap.lastmod) {
                        try {
                            const stats = fs.statSync(path.resolve(__dirname, "src", "modules", r.dir, "frontend", "content", "index.marko"));
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
            fs.writeFileSync(path.resolve(__dirname, "src", "static", "public", "sitemap.xml"), sitemapXML, "utf8");
        }
    }

    generateManifest() {
        const language = Object.keys(this.languages)[0];
        const manifest = fs.readJSONSync(path.resolve(__dirname, "src", "static", "public", "site.webmanifest"));
        manifest.name = this.meta.title[language];
        manifest.short_name = this.meta.shortTitle[language];
        manifest.description = this.meta.description[language];
        manifest.id = this.meta.id;
        fs.writeJSONSync(path.resolve(__dirname, "src", "static", "public", "site.webmanifest"), manifest, this.production ? {} : {
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
            if (fs.existsSync(path.resolve(__dirname, "src", "modules", r.dir, "frontend", "content"))) {
                const meta = fs.readJSONSync(path.resolve(__dirname, "src", "modules", r.dir, "module.json"));
                if (meta.langSwitchComponent) {
                    fs.removeSync(path.resolve(__dirname, "src", "modules", r.dir, "frontend", "content", "lang-switch"));
                    fs.ensureDirSync(path.resolve(__dirname, "src", "modules", r.dir, "frontend", "content", "lang-switch"));
                    fs.writeFileSync(path.resolve(__dirname, "src", "modules", r.dir, "frontend", "content", "lang-switch", "marko.json"), `{"tags-dir": ["../"]}`);
                    fs.writeFileSync(path.resolve(__dirname, "src", "modules", r.dir, "frontend", "content", "lang-switch", "index.marko"), langSwitchMarko);
                }
            }
        }
    }

    generateListAPI() {
        const apiCoreModules = fs.readdirSync(path.resolve(__dirname, "src", "core", "api"));
        fs.writeJSONSync(path.resolve(__dirname, "src", "build", "api-core.json"), apiCoreModules, {
            spaces: "\t"
        });
        const modules = fs.readdirSync(path.resolve(__dirname, "src", "modules")).filter(p => !p.match(/^\./));
        const apiModules = [];
        for (const module of modules) {
            if (fs.existsSync(path.resolve(__dirname, "src", "modules", module, "api"))) {
                apiModules.push(module);
            }
        }
        fs.writeJSONSync(path.resolve(__dirname, "src", "build", "api-modules.json"), apiModules, {
            spaces: "\t"
        });
    }

    copyDataDir() {
        fs.copySync(path.resolve(__dirname, "src", "static", "data"), path.resolve(__dirname, "dist", "data"));
    }
};
