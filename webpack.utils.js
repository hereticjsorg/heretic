const path = require("path");
const fs = require("fs-extra");

module.exports = class {
    constructor(production) {
        this.config = fs.readJSONSync(path.resolve(__dirname, "etc", "system.json"));
        fs.removeSync(path.resolve(__dirname, "dist/public/heretic"));
        fs.removeSync(path.resolve(__dirname, "dist/server.js"));
        fs.removeSync(path.resolve(__dirname, "src", "build"));
        fs.ensureDirSync(path.resolve(__dirname, "src", "modules"));
        fs.ensureDirSync(path.resolve(__dirname, "src", "build"));
        fs.ensureDirSync(path.resolve(__dirname, "src", "build", "loaders"));
        fs.ensureDirSync(path.resolve(__dirname, "src", "build", "components"));
        fs.ensureDirSync(path.resolve(__dirname, "src", "styles"));
        fs.ensureDirSync(path.resolve(__dirname, "logs"));
        fs.ensureDirSync(path.resolve(__dirname, "dist"));
        if (this.config.directories.tmp) {
            fs.ensureDirSync(path.resolve(__dirname, "dist", this.config.directories.tmp));
        }
        fs.ensureDirSync(path.resolve(__dirname, "dist", this.config.directories.files));
        if (!fs.existsSync(path.resolve(__dirname, "src", "static", "public"))) {
            fs.copySync(path.resolve(__dirname, "src", "core", "defaults", "public"), path.resolve(__dirname, "src", "static", "public"));
        }
        if (!fs.existsSync(path.resolve(__dirname, "src", "styles", "bulma.scss"))) {
            fs.copySync(path.resolve(__dirname, "src", "core", "defaults", "bulma.scss"), path.resolve(__dirname, "src", "styles", "bulma.scss"));
        }
        this.languages = fs.readJSONSync(path.resolve(__dirname, "src", "config", "languages.json"));
        this.meta = fs.readJSONSync(path.resolve(__dirname, "etc", "website.json"));
        this.production = production;
    }

    generateLoaders() {
        const routesData = fs.readJSONSync(path.resolve(__dirname, "src", "build", "routes.json"));
        fs.writeFileSync(path.resolve(__dirname, "src", "build", "loaders", "page-loader-userspace.js"), `module.exports = {
    loadComponent: async route => {
        switch (route) {
${routesData.routes.userspace.filter(i => i.module).map(r => `        case "${r.id}":
            return import(/* webpackChunkName: "module.${r.id}" */ "../../modules/${r.prefix}/${r.dir}/userspace/index.marko");
`).join("")}${routesData.routes.userspace.filter(i => !i.module).map(r => `        case "${r.id}":
            return import(/* webpackChunkName: "page.${r.id}" */ "../../pages/${r.dir}/userspace/index.marko");
`).join("")}        default:
            return import(/* webpackChunkName: "page.404" */ "../../core/errors/404/index.marko");
        }
    },
};\n`, "utf8");
        fs.writeFileSync(path.resolve(__dirname, "src", "build", "loaders", "page-loader-admin.js"), `module.exports = {
    loadComponent: async route => {
        switch (route) {
${routesData.routes.admin.filter(i => i.module).map(r => `        case "${r.id}":
            return import(/* webpackChunkName: "module.admin.${r.id}" */ "../../modules/${r.prefix}/${r.dir}/admin/index.marko");
`).join("")}${routesData.routes.admin.filter(i => !i.module).map(r => `        case "${r.id}":
            return import(/* webpackChunkName: "page.admin.${r.id}" */ "../../${r.core ? "core/" : ""}pages/${r.dir}/admin/index.marko");
`).join("")}        default:
            return import(/* webpackChunkName: "page.404" */ "../../core/errors/404/index.marko");
        }
    },
};\n`, "utf8");
        fs.writeFileSync(path.resolve(__dirname, "src", "build", "loaders", "page-loader-core.js"), `module.exports = {
    loadComponent: async route => {
        switch (route) {
${routesData.routes.core.map(r => `        case "${r.id}":
            return import(/* webpackChunkName: "page.${r.id}" */ "../../${r.core ? "core/" : ""}pages/${r.dir}/userspace/index.marko");
`).join("")}        default:
            return import(/* webpackChunkName: "page.404" */ "../../core/errors/404/index.marko");
        }
    },
};\n`, "utf8");
    }

    generateBuildConfigs() {
        const routesData = {
            routes: {
                admin: [],
                userspace: [],
            },
            translations: {},
            translatedPages: {},
            api: {
                modules: [],
            },
        };
        const translationsAdmin = [];
        const translations = [];
        const pagesMeta = [];
        const pagesAdminMeta = [];
        const pagesCoreMeta = [];
        const navigationData = {};
        // Process modules
        const modulesList = fs.readdirSync(path.resolve(__dirname, "src", "modules")).filter(p => !p.match(/^\./));
        for (const module of modulesList) {
            try {
                // const moduleConfig = fs.readJSONSync(path.resolve(__dirname, "src", "modules", module, "module.json"));
                const moduleConfig = require(path.resolve(__dirname, "src", "modules", module, "module.js"));
                if (fs.existsSync(path.resolve(__dirname, "src", "modules", module, "api"))) {
                    routesData.api.modules.push(module);
                }
                for (const routeId of Object.keys(moduleConfig.routes.userspace)) {
                    routesData.routes.userspace.push({
                        ...moduleConfig.routes.userspace[routeId],
                        id: `${moduleConfig.id}.${routeId}`,
                        dir: routeId,
                        prefix: moduleConfig.id,
                        module: true,
                    });
                    const modulePageConfig = fs.readJSONSync(path.resolve(__dirname, "src", "modules", moduleConfig.id, routeId, "page.json"));
                    translations.push({
                        id: `${moduleConfig.id}.${routeId}`,
                        title: modulePageConfig.title,
                        description: modulePageConfig.description,
                    });
                }
                for (const routeId of Object.keys(moduleConfig.routes.admin)) {
                    routesData.routes.admin.push({
                        ...moduleConfig.routes.admin[routeId],
                        path: `/admin${moduleConfig.routes.admin[routeId].path}`,
                        id: `${moduleConfig.id}.${routeId}`,
                        dir: routeId,
                        prefix: moduleConfig.id,
                        module: true,
                    });
                    const moduleAdminConfig = fs.readJSONSync(path.resolve(__dirname, "src", "modules", moduleConfig.id, routeId, "admin.json"));
                    translationsAdmin.push({
                        id: `${moduleConfig.id}.${routeId}`,
                        title: moduleAdminConfig.title,
                        description: moduleAdminConfig.description,
                    });
                }
            } catch {
                // Ignore
            }
        }
        // End processing modules
        fs.readdirSync(path.resolve(__dirname, "src", "core", "pages")).filter(p => !p.match(/^\./)).map(p => {
            try {
                const metaAdmin = fs.readJSONSync(path.resolve(__dirname, "src", "core", "pages", p, "admin.json"));
                pagesAdminMeta.push({
                    ...metaAdmin,
                    dir: p,
                    core: true,
                });
            } catch {
                // Ignore
            }
        });
        fs.readdirSync(path.resolve(__dirname, "src", "core", "pages")).filter(p => !p.match(/^\./)).map(p => {
            try {
                const metaCore = fs.readJSONSync(path.resolve(__dirname, "src", "core", "pages", p, "page.json"));
                pagesCoreMeta.push({
                    ...metaCore,
                    dir: p,
                    core: true,
                });
            } catch {
                // Ignore
            }
        });
        fs.readdirSync(path.resolve(__dirname, "src", "pages")).filter(p => !p.match(/^\./)).map(p => {
            try {
                const metaRoot = fs.readJSONSync(path.resolve(__dirname, "src", "pages", p, "page.json"));
                if (Array.isArray(metaRoot)) {
                    for (const mp of metaRoot) {
                        try {
                            const metaSub = fs.readJSONSync(path.resolve(__dirname, "src", "pages", p, mp, "page.json"));
                            pagesMeta.push({
                                ...metaSub,
                                dir: `${p}/${mp}`
                            });
                        } catch {
                            // Ignore
                        }
                        if (fs.existsSync(path.resolve(__dirname, "src", "pages", p, mp, "admin.json"))) {
                            try {
                                const metaAdmin = fs.readJSONSync(path.resolve(__dirname, "src", "pages", p, mp, "admin.json"));
                                pagesAdminMeta.push({
                                    ...metaAdmin,
                                    dir: `${p}/${mp}`
                                });
                            } catch {
                                // Ignore
                            }
                        }
                    }
                } else {
                    pagesMeta.push({
                        ...metaRoot,
                        dir: p
                    });
                    if (fs.existsSync(path.resolve(__dirname, "src", "pages", p, "admin.json"))) {
                        try {
                            const metaAdmin = fs.readJSONSync(path.resolve(__dirname, "src", "pages", p, "admin.json"));
                            pagesAdminMeta.push({
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
        pagesMeta.map(i => {
            routesData.routes.userspace.push({
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
        routesData.translations.userspace = translations;
        pagesAdminMeta.map(i => {
            routesData.routes.admin.push({
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
        routesData.translations.admin = translationsAdmin;
        const routesCore = [];
        const translationsCore = [];
        pagesCoreMeta.map(i => {
            routesCore.push({
                id: i.id,
                path: i.path,
                dir: i.dir,
                core: i.core,
            });
            translationsCore.push({
                id: i.id,
                title: i.title,
            });
        });
        routesData.routes.core = routesCore;
        routesData.translations.core = translationsCore;
        fs.writeFileSync(path.resolve(__dirname, "src", "build", "loaders", "i18n-loader-core.js"), `module.exports = {
            loadLanguageFile: async lang => {
                let translationCore;
                // eslint-disable-next-line prefer-const
                let translationUser = {};
                switch (lang) {
        ${Object.keys(this.languages).map(l => `        case "${l}":
                    translationCore = await import(/* webpackChunkName: "lang-core-${l}" */ "../../translations/core/${l}.json");${fs.existsSync(path.resolve(__dirname, "src", "translations", "user", `${l}.json`)) ? `
                    translationUser = await import(/* webpackChunkName: "lang-${l}" */ "../../translations/user/${l}.json");` : ""}
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
        const pages = fs.readdirSync(path.resolve(__dirname, "src", "pages")).filter(p => !p.match(/^\./));
        const translatedPages = [];
        for (const page of pages) {
            if (fs.existsSync(path.resolve(__dirname, "src", "pages", page, "translations"))) {
                translatedPages.push(page);
                fs.writeFileSync(path.resolve(__dirname, "src", "build", "loaders", `i18n-loader-${page}.js`), `module.exports = {
            loadLanguageFile: async lang => {
                let translationPage = {};
                switch (lang) {
        ${Object.keys(this.languages).map(l => `        case "${l}":
                    translationPage = await import(/* webpackChunkName: "lang-${page}-${l}" */ "../../pages/${page}/translations/${l}.json");
                    break;
        `).join("")}        default:
                    return null;
                }
                const languageData = {
                    ...translationPage,
                };
                delete languageData.default;
                return languageData;
            },
        };\n`, "utf8");
            }
        }
        const translatedModules = [];
        for (const module of modulesList) {
            if (fs.existsSync(path.resolve(__dirname, "src", "modules", module, "translations"))) {
                translatedModules.push(module);
                fs.writeFileSync(path.resolve(__dirname, "src", "build", "loaders", `i18n-loader-${module}.js`), `module.exports = {
            loadLanguageFile: async lang => {
                let translationModule = {};
                switch (lang) {
        ${Object.keys(this.languages).map(l => `        case "${l}":
                    translationModule = await import(/* webpackChunkName: "lang-${module}-${l}" */ "../../modules/${module}/translations/${l}.json");
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
        const pagesCore = fs.readdirSync(path.resolve(__dirname, "src", "core", "pages")).filter(p => !p.match(/^\./));
        const translatedPagesCore = [];
        for (const page of pagesCore) {
            if (fs.existsSync(path.resolve(__dirname, "src", "core", "pages", page, "translations"))) {
                translatedPagesCore.push(page);
                fs.writeFileSync(path.resolve(__dirname, "src", "build", "loaders", `i18n-loader-${page}.js`), `module.exports = {
            loadLanguageFile: async lang => {
                let translationPage = {};
                switch (lang) {
        ${Object.keys(this.languages).map(l => `        case "${l}":
                    translationPage = await import(/* webpackChunkName: "lang-${page}-${l}" */ "../../core/pages/${page}/translations/${l}.json");
                    break;
        `).join("")}        default:
                    return null;
                }
                const languageData = {
                    ...translationPage,
                };
                delete languageData.default;
                return languageData;
            },
        };\n`, "utf8");
            }
        }
        routesData.translatedPages.core = translatedPagesCore;
        routesData.translatedPages.user = translatedPages;
        routesData.translatedPages.module = translatedModules;
        const titles = {};
        const titlesAdmin = {};
        const userTranslations = {};
        Object.keys(this.languages).map(l => {
            titles[l] = {};
            titlesAdmin[l] = {};
            userTranslations[l] = {};
            try {
                userTranslations[l] = fs.readJSONSync(path.resolve(__dirname, "src", "translations", "user", `${l}.json`));
            } catch {
                // Ignore
            }
        });
        const navigation = fs.readJSONSync(path.resolve(__dirname, "src", "config", "navigation.json"));
        navigation.userspace.routes.map(r => {
            const id = typeof r === "string" ? r : r.id;
            let meta = {
                title: {},
            };
            try {
                meta = fs.readJSONSync(path.resolve(__dirname, "src", "pages", id, "page.json"));
            } catch {
                // Ignore
            }
            Object.keys(titles).map(lang => titles[lang][id] = meta.title[lang] || userTranslations[lang][id] || "");
        });
        navigationData.userspace = titles;
        for (const route of routesData.routes.admin) {
            try {
                if (route.module) {
                    const meta = fs.readJSONSync(path.resolve(__dirname, "src", "modules", route.prefix, route.dir, "admin.json"));
                    Object.keys(titles).map(lang => titlesAdmin[lang][route.id] = meta.title[lang] || userTranslations[lang][route.id] || "");
                } else {
                    const meta = fs.readJSONSync(path.resolve(__dirname, route.core ? "src/core" : "src", "pages", route.dir, "admin.json"));
                    Object.keys(titles).map(lang => titlesAdmin[lang][route.id] = meta.title[lang] || userTranslations[lang][route.id] || "");
                }
            } catch {
                // Ignore
            }
        }
        navigationData.admin = titlesAdmin;
        routesData.i18nNavigation = navigationData;
        const apiCorePages = fs.readdirSync(path.resolve(__dirname, "src", "core", "api"));
        const apiPages = [];
        for (const page of pages) {
            if (fs.existsSync(path.resolve(__dirname, "src", "pages", page, "api"))) {
                apiPages.push(page);
            }
        }
        routesData.api = {
            ...routesData.api,
            core: apiCorePages,
            userspace: apiPages,
        };
        routesData.server = {
            production: this.production,
        };
        routesData.directories = {
            pages,
            pagesCore,
            modules: modulesList,
        };
        // Write configuration file
        fs.writeJSONSync(path.resolve(__dirname, "src", "build", "routes.json"), routesData, {
            spaces: "\t",
        });
    }

    generateAdminIconsLoader() {
        const routesData = fs.readJSONSync(path.resolve(__dirname, "src", "build", "routes.json"));
        const icons = [];
        const pages = {};
        for (const route of routesData.routes.admin) {
            try {
                if (route.module) {
                    const meta = fs.readJSONSync(path.resolve(__dirname, "src", "modules", route.prefix, route.dir, "admin.json"));
                    if (meta.icon) {
                        icons.push(meta.icon);
                        pages[meta.icon] = route.id.replace(/\./gm, "_");
                    }
                } else {
                    const meta = fs.readJSONSync(path.resolve(__dirname, route.core ? "src/core" : "src", "pages", route.dir, "admin.json"));
                    if (meta.icon) {
                        icons.push(meta.icon);
                        pages[meta.icon] = route.id.replace(/\./gm, "_");
                    }
                }
            } catch {
                // Ignore
            }
        }
        const code = `${icons.length ? `${icons.map(icon => `import { ${icon} as ${pages[icon]} } from "@mdi/js"`).join("\n")}` : ""}${icons.length ? "\n" : ""}
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
        xmlns="http://www.w3.org/2000/svg">\n${icons.map(icon => `        <if(input.id === "${pages[icon]}")>
            <path d=${pages[icon]}/>
        </if>`).join("\n")}\n    </svg>
</div>
`;
        const style = `.hr-icon-admin-wrap {
    display: inline-flex;
    align-self: center;
}

.hr-icon-admin {
    position: relative;
}`;
        fs.ensureDirSync(path.resolve(__dirname, "src", "build", "components", "hicon-admin"));
        fs.writeFileSync(path.resolve(__dirname, "src", "build", "components", "hicon-admin", "index.marko"), code);
        fs.writeFileSync(path.resolve(__dirname, "src", "build", "components", "hicon-admin", "style.scss"), style);
    }

    generateSitemap() {
        const sitemapData = [];
        const routesData = fs.readJSONSync(path.resolve(__dirname, "src", "build", "routes.json"));
        for (const r of routesData.routes.userspace) {
            try {
                const sitemap = fs.readJSONSync(path.resolve(__dirname, "src", "pages", r.dir, "sitemap.json"));
                if (sitemap.include) {
                    const entry = {
                        loc: `${this.meta.url}${r.path}`,
                    };
                    if (sitemap.lastmod) {
                        try {
                            const stats = fs.statSync(path.resolve(__dirname, "src", "pages", r.dir, "userspace", "content", "index.marko"));
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
            fs.ensureDirSync(path.resolve(__dirname, "dist", "public", "heretic"));
            fs.writeFileSync(path.resolve(__dirname, "dist", "public", "heretic", "sitemap.xml"), sitemapXML, "utf8");
        }
    }

    generateManifest() {
        const manifest = {
            id: "heretic",
            icons: [{
                    src: "/heretic/android-chrome-192x192.png",
                    sizes: "192x192",
                    type: "image/png"
                },
                {
                    src: "/heretic/android-chrome-512x512.png",
                    sizes: "512x512",
                    type: "image/png"
                }
            ],
            theme_color: "#ffffff",
            background_color: "#ffffff",
            display: "standalone",
            name: "",
            short_name: "",
            description: ""
        };
        const language = Object.keys(this.languages)[0];
        manifest.name = this.meta.title[language];
        manifest.short_name = this.meta.shortTitle[language];
        manifest.description = this.meta.description[language];
        manifest.id = this.meta.id;

        fs.ensureDirSync(path.resolve(__dirname, "dist", "public", "heretic"));
        fs.writeJSONSync(path.resolve(__dirname, "dist", "public", "heretic", "site.webmanifest"), manifest, this.production ? {} : {
            spaces: "\t",
        });
    }

    generateLangSwitchComponents() {
        const routesData = fs.readJSONSync(path.resolve(__dirname, "src", "build", "routes.json"));
        let langSwitchMarko = "$ const language = process.browser ? window.__heretic.outGlobal.language : out.global.language;\n\n";
        Object.keys(this.languages).map(lang => langSwitchMarko += `<if(language === "${lang}")>\n    <lang-${lang}/>\n</if>\n`);
        for (const r of routesData.routes.userspace) {
            if (!r.module && fs.existsSync(path.resolve(__dirname, "src", "pages", r.dir, "userspace", "content"))) {
                const meta = fs.readJSONSync(path.resolve(__dirname, "src", "pages", r.dir, "page.json"));
                if (meta.langSwitchComponent) {
                    fs.removeSync(path.resolve(__dirname, "src", "pages", r.dir, "userspace", "content", "lang-switch"));
                    fs.ensureDirSync(path.resolve(__dirname, "src", "pages", r.dir, "userspace", "content", "lang-switch"));
                    fs.writeFileSync(path.resolve(__dirname, "src", "pages", r.dir, "userspace", "content", "lang-switch", "marko.json"), `{"tags-dir": ["../"]}`);
                    fs.writeFileSync(path.resolve(__dirname, "src", "pages", r.dir, "userspace", "content", "lang-switch", "index.marko"), langSwitchMarko);
                }
            }
        }
    }

    copyDataDir() {
        fs.copySync(path.resolve(__dirname, "src", "static", "data"), path.resolve(__dirname, "dist", "data"));
    }
};
