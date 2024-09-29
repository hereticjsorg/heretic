/* eslint-disable no-loop-func */
const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const systemInformation = require("systeminformation");

const BinUtils = require("#lib/binUtils.js");

const languages = require(path.resolve(__dirname, "site/etc/languages.json"));
const systemConfig = require(path.resolve(__dirname, "site/etc/system.js"));
const siteConfig = require(path.resolve(__dirname, "site/etc/website.js"));
const buildConfig = require(path.resolve(__dirname, "webpack.utils.json"));
const navigationConfig = require(
    path.resolve(__dirname, "site/etc/navigation.json"),
);
const packageJson = require("./package.json");

module.exports = class {
    constructor(production) {
        this.production = production;
        this.systemConfig = systemConfig;
        this.siteConfig = siteConfig;
        this.buildConfig = buildConfig;
        this.languages = languages;
        this.binUtils = new BinUtils({});
        this.dirAliases = {};
        this.directories = [];
        this.pages = [];
        this.pathsTranslated = [];
        for (const i of Object.keys(packageJson.imports)) {
            const [key] = i.split(/\//);
            const [dir] = packageJson.imports[i].split(/\/\*/);
            this.dirAliases[key] = path.resolve(dir);
        }
    }

    initDirectories() {
        for (const dir of this.buildConfig.removeDirectories) {
            fs.removeSync(path.resolve(__dirname, dir));
        }
        for (const dir of this.buildConfig.ensureDirectories) {
            fs.ensureDirSync(path.resolve(__dirname, dir));
        }
        if (this.systemConfig.directories.tmp) {
            fs.ensureDirSync(
                path.resolve(
                    __dirname,
                    "dist",
                    this.systemConfig.directories.tmp,
                ),
            );
        }
        fs.ensureDirSync(
            path.resolve(
                __dirname,
                "dist",
                this.systemConfig.directories.files,
            ),
        );
        if (!fs.existsSync(path.resolve(__dirname, "site/static/public"))) {
            fs.copySync(
                path.resolve(__dirname, "src/core/defaults/public"),
                path.resolve(__dirname, "site/static/public"),
            );
        }
        fs.copySync(
            path.resolve(__dirname, "site/static/data"),
            path.resolve(__dirname, "dist.new/data"),
        );
    }

    async generateConfig() {
        const buildData = {
            production: this.production,
            timestamp: new Date().getTime(),
            version: packageJson.version,
            system: {
                os: await systemInformation.osInfo(),
                cpu: await systemInformation.cpu(),
                memory: await systemInformation.mem(),
            },
            modules: [],
            i18nNavigation: {},
            routes: {
                userspace: [],
                admin: [],
            },
        };
        const t = {};
        let unusedLanguageFiles = false;
        let defaultLanguageData = {};
        if (
            fs.existsSync(
                path.resolve(
                    __dirname,
                    `site/translations/${Object.keys(languages)[0]}.json`,
                ),
            )
        ) {
            defaultLanguageData = fs.readJSONSync(
                path.resolve(
                    __dirname,
                    `site/translations/${Object.keys(languages)[0]}.json`,
                ),
            );
        }
        const languageFiles = fs
            .readdirSync(path.resolve(__dirname, `site/translations`))
            .map((i) => i.replace(/\.json$/, ""));
        for (const lang of languageFiles) {
            if (Object.keys(languages).indexOf(lang) < 0) {
                unusedLanguageFiles = true;
            }
        }
        for (const lang of Object.keys(languages)) {
            if (
                defaultLanguageData &&
                !fs.existsSync(
                    path.resolve(__dirname, `site/translations/${lang}.json`),
                )
            ) {
                fs.writeJSONSync(
                    path.resolve(__dirname, `site/translations/${lang}.json`),
                    defaultLanguageData,
                    {
                        spaces: "  ",
                    },
                );
                // eslint-disable-next-line no-console
                console.log(
                    `[Warning] Created new file: site/translations/${lang}.json`,
                );
            }
            if (
                fs.existsSync(
                    path.resolve(__dirname, `site/translations/${lang}.json`),
                )
            ) {
                t[lang] = fs.readJSONSync(
                    path.resolve(__dirname, `site/translations/${lang}.json`),
                );
            }
        }
        for (const lang of Object.keys(languages)) {
            buildData.i18nNavigation[lang] = {};
            for (const r of navigationConfig.userspace.routes) {
                buildData.i18nNavigation[lang][
                    typeof r === "string" ? r : r.id
                ] = "";
            }
        }
        const siteModules = {
            core: [],
            site: [],
        };
        siteModules["site"] = fs
            .readdirSync(
                path.resolve(__dirname, buildConfig.moduleDirectories["site"]),
            )
            .filter((p) => !p.match(/^\./));
        siteModules["core"] = fs
            .readdirSync(
                path.resolve(__dirname, buildConfig.moduleDirectories["core"]),
            )
            .filter(
                (p) => !p.match(/^\./) && siteModules["site"].indexOf(p) === -1,
            );
        const dynamicLoaderData = {
            api: [],
            ws: [],
            provider: [],
            setup: [],
            search: [],
            pages: [],
            translations: [],
        };
        for (const mk of Object.keys(buildConfig.moduleDirectories)) {
            const modulePath = buildConfig.moduleDirectories[mk];
            for (const module of siteModules[mk]) {
                try {
                    const dynamicPath = path.resolve(
                        __dirname,
                        `${modulePath}/${module}/dynamic.js`,
                    );
                    if (fs.existsSync(dynamicPath)) {
                        try {
                            const dynamicGenerator = require(dynamicPath);
                            await dynamicGenerator();
                        } catch {
                            // Ignore
                        }
                    }
                    const moduleConfig = require(
                        path.resolve(
                            __dirname,
                            `${modulePath}/${module}/module.js`,
                        ),
                    );
                    let defaultModuleLanguageData = {};
                    if (
                        fs.existsSync(
                            path.resolve(
                                __dirname,
                                `${modulePath}/${module}/translations/${Object.keys(languages)[0]}.json`,
                            ),
                        )
                    ) {
                        defaultModuleLanguageData = fs.readJSONSync(
                            path.resolve(
                                __dirname,
                                `${modulePath}/${module}/translations/${Object.keys(languages)[0]}.json`,
                            ),
                        );
                    }
                    for (const lang of languageFiles) {
                        if (Object.keys(languages).indexOf(lang) < 0) {
                            unusedLanguageFiles = true;
                        }
                    }
                    for (const lang of Object.keys(languages)) {
                        if (
                            Object.keys(defaultModuleLanguageData).length &&
                            !fs.existsSync(
                                path.resolve(
                                    __dirname,
                                    `${modulePath}/${module}/translations/${lang}.json`,
                                ),
                            )
                        ) {
                            fs.writeJSONSync(
                                path.resolve(
                                    __dirname,
                                    `${modulePath}/${module}/translations/${lang}.json`,
                                ),
                                defaultModuleLanguageData,
                                {
                                    spaces: "  ",
                                },
                            );
                            // eslint-disable-next-line no-console
                            console.log(
                                `[Warning] Created new file: ${modulePath}/${module}/translations/${lang}.json`,
                            );
                        }
                        if (
                            fs.existsSync(
                                path.resolve(
                                    __dirname,
                                    `${modulePath}/${module}/translations/${lang}.json`,
                                ),
                            )
                        ) {
                            t[lang] = {
                                ...t[lang],
                                ...fs.readJSONSync(
                                    path.resolve(
                                        __dirname,
                                        `${modulePath}/${module}/translations/${lang}.json`,
                                    ),
                                ),
                            };
                        }
                    }
                    const moduleData = {
                        id: moduleConfig.id,
                        path: `${modulePath}/${module}`,
                        pages: [],
                        translations: fs.existsSync(
                            path.resolve(
                                __dirname,
                                `${modulePath}/${module}/translations`,
                            ),
                        ),
                        setup: fs.existsSync(
                            path.resolve(
                                __dirname,
                                modulePath,
                                module,
                                "setup.js",
                            ),
                        ),
                        search: fs.existsSync(
                            path.resolve(
                                __dirname,
                                modulePath,
                                module,
                                "search.js",
                            ),
                        ),
                    };
                    if (moduleData.translations) {
                        const tp = {};
                        tp[moduleConfig.id] = moduleData.path;
                        this.pathsTranslated.push(tp);
                    }
                    moduleData.provider = fs.existsSync(
                        path.resolve(
                            __dirname,
                            modulePath,
                            module,
                            "data/provider.js",
                        ),
                    );
                    if (moduleData.provider) {
                        dynamicLoaderData.provider.push(
                            `${modulePath}/${module}/data`,
                        );
                    }
                    moduleData.api = fs.existsSync(
                        path.resolve(__dirname, modulePath, module, "api"),
                    );
                    moduleData.ws = fs.existsSync(
                        path.resolve(
                            __dirname,
                            modulePath,
                            module,
                            "ws/index.js",
                        ),
                    );
                    if (moduleConfig.routes) {
                        for (const routeType of ["userspace", "admin"]) {
                            for (const k of moduleConfig.routes[routeType]
                                ? Object.keys(moduleConfig.routes[routeType])
                                : []) {
                                if (
                                    fs.existsSync(
                                        path.resolve(
                                            __dirname,
                                            modulePath,
                                            module,
                                            k,
                                        ),
                                    )
                                ) {
                                    const moduleDataItem = {
                                        id: k,
                                        routePath:
                                            routeType === "admin"
                                                ? `/admin${moduleConfig.routes[routeType][k].path}`
                                                : moduleConfig.routes[
                                                      routeType
                                                  ][k].path,
                                        metaData: {
                                            title: {},
                                            description: {},
                                        },
                                        type: routeType,
                                        sitemap: fs.existsSync(
                                            path.resolve(
                                                __dirname,
                                                modulePath,
                                                module,
                                                k,
                                                "sitemap.json",
                                            ),
                                        ),
                                        ws: fs.existsSync(
                                            path.resolve(
                                                __dirname,
                                                modulePath,
                                                module,
                                                k,
                                                "ws.js",
                                            ),
                                        ),
                                        provider: fs.existsSync(
                                            path.resolve(
                                                __dirname,
                                                modulePath,
                                                module,
                                                k,
                                                "provider.js",
                                            ),
                                        ),
                                    };
                                    if (moduleDataItem.ws) {
                                        dynamicLoaderData.ws.push(
                                            `${modulePath}/${module}/${k}`,
                                        );
                                    }
                                    if (moduleDataItem.provider) {
                                        dynamicLoaderData.provider.push(
                                            `${modulePath}/${module}/${k}`,
                                        );
                                    }
                                    buildData.routes[routeType].push({
                                        id: `${moduleConfig.id}_${k}`,
                                        path: moduleDataItem.routePath,
                                    });
                                    if (
                                        fs.existsSync(
                                            path.resolve(
                                                __dirname,
                                                modulePath,
                                                module,
                                                k,
                                                "page.js",
                                            ),
                                        )
                                    ) {
                                        const pageConfig = require(
                                            path.resolve(
                                                __dirname,
                                                modulePath,
                                                module,
                                                k,
                                                "page.js",
                                            ),
                                        );
                                        moduleDataItem.metaData = {
                                            title: pageConfig.title || {},
                                            description:
                                                pageConfig.description || {},
                                        };
                                        for (const lang of Object.keys(
                                            languages,
                                        )) {
                                            buildData.i18nNavigation[lang][
                                                `${moduleConfig.id}_${k}`
                                            ] =
                                                pageConfig.title &&
                                                pageConfig.title[lang]
                                                    ? pageConfig.title[lang]
                                                    : t[lang][
                                                          `${moduleConfig.id}_${k}`
                                                      ] || "";
                                            for (const kn of Object.keys(
                                                buildData.i18nNavigation[lang],
                                            )) {
                                                buildData.i18nNavigation[lang][
                                                    kn
                                                ] =
                                                    buildData.i18nNavigation[
                                                        lang
                                                    ][kn] ||
                                                    t[lang][kn] ||
                                                    "";
                                            }
                                        }
                                        if (pageConfig.icon) {
                                            moduleDataItem.icon =
                                                pageConfig.icon;
                                        }
                                        if (pageConfig.langSwitchComponent) {
                                            moduleDataItem.langSwitchComponent = true;
                                        }
                                    }
                                    moduleData.pages.push(moduleDataItem);
                                    dynamicLoaderData.pages.push(
                                        `${modulePath}/${module}/${k}`,
                                    );
                                    this.pages.push({
                                        ...moduleDataItem,
                                        moduleId: moduleConfig.id,
                                        path: `${modulePath}/${module}/${k}`,
                                    });
                                }
                            }
                        }
                    }
                    // Generate dynamicLoader data
                    if (moduleData.api) {
                        dynamicLoaderData.api.push(`${modulePath}/${module}`);
                    }
                    if (moduleData.setup) {
                        dynamicLoaderData.setup.push(`${modulePath}/${module}`);
                    }
                    if (moduleData.search) {
                        dynamicLoaderData.search.push(
                            `${modulePath}/${module}`,
                        );
                    }
                    if (moduleData.translations) {
                        dynamicLoaderData.translations.push(
                            `${modulePath}/${module}`,
                        );
                    }
                    //
                    buildData.modules.push(moduleData);
                } catch {
                    // Ignore
                }
            }
        }
        buildData.coreSetupFiles = fs.readdirSync(
            path.resolve(__dirname, "src", "core", "setup"),
        );
        fs.writeJSONSync(
            path.resolve(__dirname, ".build", "build.json"),
            buildData,
            {
                spaces: "    ",
            },
        );
        let dynamicLoaderFile = `export default class {\n`;
        if (dynamicLoaderData.api.length) {
            dynamicLoaderFile += `    static async loadAPI(mpath) {
        switch (mpath) {\n`;
            for (const i of dynamicLoaderData.api) {
                dynamicLoaderFile += `            case "${i}":
                return import("#${i}/api/index.js");\n`;
            }
            dynamicLoaderFile += `        }\n    }\n`;
        }
        if (dynamicLoaderData.setup.length) {
            dynamicLoaderFile += `\n    static async loadSetup(mpath) {
        switch (mpath) {\n`;
            for (const i of dynamicLoaderData.setup) {
                dynamicLoaderFile += `            case "${i}":
                return import("#${i}/setup.js");\n`;
            }
            dynamicLoaderFile += `        }\n    }\n`;
        }
        if (dynamicLoaderData.ws.length) {
            dynamicLoaderFile += `\n    static async loadWS(mpath) {
        switch (mpath) {\n`;
            for (const i of dynamicLoaderData.ws) {
                dynamicLoaderFile += `            case "${i}":
                return import("#${i}/ws.js");\n`;
            }
            dynamicLoaderFile += `        }\n    }\n`;
        }
        if (dynamicLoaderData.provider.length) {
            dynamicLoaderFile += `\n    static async loadProvider(mpath) {
        switch (mpath) {\n`;
            for (const i of dynamicLoaderData.provider) {
                dynamicLoaderFile += `            case "${i}":
                return import("#${i}/provider.js");\n`;
            }
            dynamicLoaderFile += `        }\n    }\n`;
        }
        if (dynamicLoaderData.search.length) {
            dynamicLoaderFile += `\n    static async loadSearch(mpath) {
        switch (mpath) {\n`;
            for (const i of dynamicLoaderData.search) {
                dynamicLoaderFile += `            case "${i}":
                return import("#${i}/search.js");\n`;
            }
            dynamicLoaderFile += `        }\n    }\n`;
        }
        if (dynamicLoaderData.pages.length) {
            dynamicLoaderFile += `\n    static async loadPage(mpath) {
        switch (mpath) {\n`;
            for (const i of dynamicLoaderData.pages) {
                dynamicLoaderFile += `            case "${i}":
                return import("#${i}/server.marko");\n`;
            }
            dynamicLoaderFile += `        }\n    }\n`;
        }
        if (dynamicLoaderData.translations.length) {
            dynamicLoaderFile += `\n    static async loadTranslation(mpath, lang) {\n`;
            for (const lang of Object.keys(languages)) {
                dynamicLoaderFile += `        if (lang === "en-us") {
            switch (mpath) {\n`;
                for (const i of dynamicLoaderData.translations) {
                    dynamicLoaderFile += `                case "${i}":
                    return import(\`#${i}/translations/${lang}.json\`);\n`;
                }
                dynamicLoaderFile += `            }\n        }\n`;
            }
            dynamicLoaderFile += `    }\n`;
        }
        //
        dynamicLoaderFile += `}\n`;
        //
        fs.writeFileSync(
            path.resolve(__dirname, ".build", "dynamicLoader.js"),
            dynamicLoaderFile,
        );
        this.buildData = buildData;
        fs.writeJSONSync(
            path.resolve(__dirname, "dist.new/public/heretic/version.json"),
            {
                version: crypto
                    .createHmac("sha256", this.systemConfig.secret)
                    .update(packageJson.version)
                    .digest("hex"),
            },
            {
                spaces: "  ",
            },
        );
        if (unusedLanguageFiles) {
            // eslint-disable-next-line no-console
            console.log("Warning: unused translation files found");
        }
    }

    generateLoaders() {
        for (const type of ["userspace", "admin"]) {
            fs.writeFileSync(
                path.resolve(
                    __dirname,
                    `.build/loaders/page-loader-${type}.js`,
                ),
                `/* eslint-disable import/no-useless-path-segments */\n\nmodule.exports = {
    loadComponent: async route => {
        switch (route) {\n${this.pages
            .filter((i) => i.type === type)
            .map(
                (p) => `        case "${p.moduleId}_${p.id}":
            return import(/* webpackChunkName: "page.${p.moduleId}_${p.id}" */ "../../${p.path}/index.marko");\n`,
            )
            .join("")}        default:
            return import(/* webpackChunkName: "page.${type}404" */ "../../site/errors/404/index.marko");
        }
    },\n};\n`,
                "utf8",
            );
        }
        fs.writeFileSync(
            path.resolve(__dirname, ".build", "loaders", "i18n-loader-core.js"),
            `/* eslint-disable import/no-useless-path-segments */\n\nmodule.exports = {\n    loadLanguageFile: async lang => {
        let translationCore;
        // eslint-disable-next-line prefer-const
        let translationUser = {};
        switch (lang) {
        ${Object.keys(this.languages)
            .map(
                (l) => `case "${l}":
            translationCore = await import(/* webpackChunkName: "lang-core-${l}" */ "../../src/translations/${l}.json");${
                fs.existsSync(
                    path.resolve(
                        __dirname,
                        "src",
                        "translations",
                        "user",
                        `${l}.json`,
                    ),
                )
                    ? `
            translationUser = await import(/* webpackChunkName: "lang-${l}" */ "../../site/translations/${l}.json");`
                    : ""
            }
            break;
        `,
            )
            .join("")}default:
            return null;
        }
        const languageData = {
            ...translationCore,
            ...translationUser
        };
        delete languageData.default;
        return languageData;
    },\n};\n`,
            "utf8",
        );
        for (const item of this.pathsTranslated) {
            const id = Object.keys(item)[0];
            const pathTranslated = item[id];
            fs.writeFileSync(
                path.resolve(__dirname, `.build/loaders/i18n-loader-${id}.js`),
                `/* eslint-disable import/no-useless-path-segments */\n\nmodule.exports = {
    loadLanguageFile: async lang => {
        let translationPage = {};
        switch (lang) {
${Object.keys(this.languages)
    .map(
        (l) => `        case "${l}":
            translationPage = await import(/* webpackChunkName: "lang-${id}-${l}" */ "../../${pathTranslated}/translations/${l}.json");
            break;\n`,
    )
    .join("")}        default:
            return null;
        }
        const languageData = {
            ...translationPage,
        };
        delete languageData.default;
        return languageData;
    },
};\n`,
                "utf8",
            );
        }
    }

    generateAdminIconsComponent() {
        const icons = this.pages
            .filter((i) => i.icon)
            .map((i) => ({
                icon: i.icon,
                id: i.id,
                moduleId: i.moduleId,
            }));
        const code = `${icons.length ? `${icons.map((i) => `import { ${i.icon} as ${i.moduleId}_${i.id} } from "@mdi/js"`).join("\n")}` : ""}${icons.length ? "\n" : ""}
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
        xmlns="http://www.w3.org/2000/svg">\n${icons
            .map(
                (i) => `        <if(input.id === "${i.moduleId}_${i.id}")>
            <path d=${i.moduleId}_${i.id}/>
        </if>`,
            )
            .join("\n")}\n    </svg>
</div>
`;
        const style = `.hr-icon-admin-wrap {
    display: inline-flex;
    align-self: center;
}

.hr-icon-admin {
    position: relative;
}`;
        fs.writeFileSync(
            path.resolve(
                __dirname,
                ".build/components/hicon-admin/index.marko",
            ),
            code,
        );
        fs.writeFileSync(
            path.resolve(__dirname, ".build/components/hicon-admin/style.scss"),
            style,
        );
    }

    generateSitemap() {
        const sitemapData = [];
        for (const page of this.pages) {
            if (!page.sitemap) {
                continue;
            }
            try {
                const sitemap = fs.readJSONSync(
                    path.resolve(__dirname, page.path, "sitemap.json"),
                );
                if (sitemap.include) {
                    const entry = {
                        loc: `${this.siteConfig.url}${page.routePath}`,
                    };
                    if (sitemap.lastmod) {
                        try {
                            const stats = fs.statSync(
                                path.resolve(
                                    __dirname,
                                    page.path,
                                    "content/index.marko",
                                ),
                            );
                            entry.lastmod = new Date(stats.mtime)
                                .toISOString()
                                .slice(0, 10);
                        } catch (e) {
                            entry.lastmod = new Date()
                                .toISOString()
                                .slice(0, 10);
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
            sitemapData.map((i) => {
                sitemapXML += `<url>`;
                Object.keys(i).map((t) => {
                    sitemapXML += `<${t}>${i[t]}</${t}>`;
                });
                sitemapXML += `</url>`;
            });
            sitemapXML += `</urlset>`;
            fs.writeFileSync(
                path.resolve(__dirname, "dist.new/public/heretic/sitemap.xml"),
                sitemapXML,
                "utf8",
            );
        }
    }

    generateManifest() {
        const manifest = {
            id: "heretic",
            icons: [
                {
                    src: "/heretic/android-chrome-192x192.png",
                    sizes: "192x192",
                    type: "image/png",
                },
                {
                    src: "/heretic/android-chrome-512x512.png",
                    sizes: "512x512",
                    type: "image/png",
                },
            ],
            theme_color: "#ffffff",
            background_color: "#ffffff",
            display: "standalone",
            name: "",
            short_name: "",
            description: "",
        };
        const language = Object.keys(this.languages)[0];
        manifest.name = this.siteConfig.title[language];
        manifest.short_name = this.siteConfig.shortTitle[language];
        manifest.description = this.siteConfig.description[language];
        manifest.id = this.systemConfig.id;
        fs.writeJSONSync(
            path.resolve(__dirname, "dist.new/public/heretic/site.webmanifest"),
            manifest,
            this.production
                ? {}
                : {
                      spaces: "  ",
                  },
        );
    }

    generateLangSwitchComponents() {
        let langSwitchMarko =
            "$ const language = process.browser ? window.__heretic.outGlobal.language : out.global.language;\n\n";
        Object.keys(this.languages).map(
            (lang) =>
                (langSwitchMarko += `<if(language === "${lang}")>\n    <lang-${lang}/>\n</if>\n`),
        );
        for (const page of this.pages) {
            if (
                page.langSwitchComponent &&
                fs.existsSync(path.resolve(__dirname, page.path, "content"))
            ) {
                fs.removeSync(
                    path.resolve(__dirname, page.path, "content/lang-switch"),
                );
                fs.ensureDirSync(
                    path.resolve(__dirname, page.path, "content/lang-switch"),
                );
                fs.writeFileSync(
                    path.resolve(
                        __dirname,
                        page.path,
                        "content/lang-switch/marko.json",
                    ),
                    `{"tags-dir": ["../"]}`,
                );
                fs.writeFileSync(
                    path.resolve(
                        __dirname,
                        page.path,
                        "content/lang-switch/index.marko",
                    ),
                    langSwitchMarko,
                );
            }
        }
    }

    processMarkoJsonFile(p) {
        const filename = path.basename(p);
        const dirname = path.dirname(p);
        if (filename === "marko.src.json") {
            const data = fs.readJSONSync(p);
            if (data["tags-dir"]) {
                data["tags-dir"].forEach((t, i) => {
                    for (const k of Object.keys(this.dirAliases)) {
                        t = t.replace(
                            new RegExp(`^${k}`, "i"),
                            this.dirAliases[k],
                        );
                    }
                    data["tags-dir"][i] = t;
                });
            }
            fs.writeJSONSync(path.resolve(`${dirname}/marko.json`), data);
        }
    }

    async processJunkFiles() {
        for await (const p of this.binUtils.walkDir(path.join(__dirname))) {
            const filename = path.basename(p);
            if (filename === ".DS_Store") {
                fs.unlinkSync(p);
            }
        }
    }

    async processMarkoJson() {
        for await (const p of this.binUtils.walkDir(
            path.join(__dirname, "site"),
        )) {
            this.processMarkoJsonFile(p);
        }
        for await (const p of this.binUtils.walkDir(
            path.join(__dirname, "src"),
        )) {
            this.processMarkoJsonFile(p);
        }
    }

    processMetaJsonFile(p) {
        const filename = path.basename(p);
        const dirname = path.dirname(p);
        if (filename === "meta.src.json") {
            if (fs.existsSync(path.resolve(`${dirname}/meta.json`))) {
                fs.unlinkSync(path.resolve(`${dirname}/meta.json`));
            }
            fs.copySync(
                path.resolve(`${dirname}/meta.src.json`),
                path.resolve(`${dirname}/meta.json`),
            );
        }
    }

    async processMetaJson() {
        for await (const p of this.binUtils.walkDir(
            path.join(__dirname, "site"),
        )) {
            this.processMetaJsonFile(p);
        }
        for await (const p of this.binUtils.walkDir(
            path.join(__dirname, "src"),
        )) {
            this.processMetaJsonFile(p);
        }
    }

    processBinScript() {
        const dockerComposeSrc = fs
            .readFileSync(
                path.resolve(__dirname, "src/bin/docker-compose.src.sh"),
                "utf8",
            )
            .replace(/\[HERETIC_VERSION\]/gm, packageJson.version);
        fs.writeFileSync(
            path.resolve(__dirname, "src/bin/docker-compose.sh"),
            dockerComposeSrc,
        );
    }
};
