const template = require("lodash.template");
const languagesList = require("../../../etc/languages.json");

export default class {
    constructor(component, language) {
        this.component = component;
        this.language = language;
    }

    waitForLanguageData() {
        const timeout = 20000;
        const start = Date.now();
        const wait = (resolve, reject) => {
            if (!process.browser) {
                resolve();
            }
            if (window.__heretic && window.__heretic.t) {
                resolve();
            } else if (timeout && (Date.now() - start) >= timeout) {
                reject(new Error("Language data not loaded"));
            } else {
                setTimeout(wait.bind(this, resolve, reject), 30);
            }
        };
        return new Promise(wait);
    }

    waitForComponent(id) {
        const timeout = 5000;
        const start = Date.now();
        const wait = (resolve, reject) => {
            if (!process.browser) {
                resolve();
            }
            if (this.component.getComponent(id)) {
                resolve();
            } else if (timeout && (Date.now() - start) >= timeout) {
                reject(new Error(`Component not found: ${id}`));
            } else {
                setTimeout(wait.bind(this, resolve, reject), 30);
            }
        };
        return new Promise(wait);
    }

    waitForElement(id) {
        const timeout = 5000;
        const start = Date.now();
        const wait = (resolve, reject) => {
            if (!process.browser) {
                resolve();
            }
            if (document.getElementById(id)) {
                resolve();
            } else if (timeout && (Date.now() - start) >= timeout) {
                reject(new Error(`Element not found: ${id}`));
            } else {
                setTimeout(wait.bind(this, resolve, reject), 30);
            }
        };
        return new Promise(wait);
    }

    async loadLanguageData(page) {
        if (process.browser && window.__heretic && window.__heretic.languageData) { // && !window.__heretic.translationsLoaded[page]
            const i18nLoader = require(`../../build/loaders/i18n-loader-${page}`);
            window.__heretic.translationsLoaded[page] = true;
            const languageData = {
                ...window.__heretic.languageData,
                ...await i18nLoader.loadLanguageFile(this.language)
            };
            Object.keys(languageData).map(i => languageData[i] = typeof languageData[i] === "string" ? template(languageData[i]) : languageData[i]);
            window.__heretic.languageData = languageData;
        }
    }

    getNonLocalizedURL(url) {
        const languages = Object.keys(languagesList);
        const data = {
            url: "",
        };
        if (!url) {
            return data;
        }
        const urlParts = url.split(/\//);
        if (urlParts.length > 1) {
            const firstPartOfURL = urlParts[1];
            if (languages.indexOf(firstPartOfURL) > -1) {
                [data.language] = urlParts.splice(1, 1);
            } else {
                [data.language] = languages;
            }
            data.url = urlParts.join("/") || "/";
            data.url = data.url.length > 1 ? data.url.replace(/\/$/, "") : data.url;
        } else {
            data.url = "";
            [data.language] = languages;
        }
        data.parts = urlParts;
        data.base = `${urlParts[0]}//${urlParts[2]}`;
        data.dir = urlParts.length > 3 ? urlParts.filter((_, i) => i > 2).join("/") : "";
        return data;
    }

    getLocalizedURL(url) {
        const nonLocalizedURL = this.getNonLocalizedURL(url);
        const resultURL = this.language === Object.keys(languagesList)[0] ? nonLocalizedURL.url : `/${this.language}${nonLocalizedURL.url}`;
        return resultURL.endsWith("/") && resultURL.length > 1 ? resultURL.slice(0, -1) : resultURL;
    }

    getLocalizedFullURL(url) {
        const nonLocalizedURL = this.getNonLocalizedURL(url);
        const resultURL = this.language === Object.keys(languagesList)[0] ? nonLocalizedURL.url : `${nonLocalizedURL.base}/${this.language}/${nonLocalizedURL.dir}`;
        return resultURL.endsWith("/") && resultURL.length > 1 ? resultURL.slice(0, -1) : resultURL;
    }

    showOAuthPopup(path) {
        const features = {
            popup: "yes",
            width: 600,
            height: 700,
            top: "auto",
            left: "auto",
            toolbar: "no",
            menubar: "no",
        };
        const strWindowsFeatures = Object.entries(features)
            .reduce((str, [key, value]) => {
                if (value === "auto") {
                    if (key === "top") {
                        const v = Math.round(
                            window.innerHeight / 2 - features.height / 2
                        );
                        str += `top=${v},`;
                    } else if (key === "left") {
                        const v = Math.round(
                            window.innerWidth / 2 - features.width / 2
                        );
                        str += `left=${v},`;
                    }
                    return str;
                }
                str += `${key}=${value},`;
                return str;
            }, "")
            .slice(0, -1);
        window.open(path, "_blank", strWindowsFeatures);
    }
}
