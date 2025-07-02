import template from "lodash/template";
import languagesList from "#etc/languages.json";

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
            if (window.__heretic && window.__heretic.t && window.__heretic.languageData) {
                resolve();
            } else if (timeout && Date.now() - start >= timeout) {
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
            } else if (timeout && Date.now() - start >= timeout) {
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
            } else if (timeout && Date.now() - start >= timeout) {
                reject(new Error(`Element not found: ${id}`));
            } else {
                setTimeout(wait.bind(this, resolve, reject), 30);
            }
        };
        return new Promise(wait);
    }

    waitForSelector(selector) {
        const timeout = 5000;
        const start = Date.now();
        const wait = (resolve, reject) => {
            if (!process.browser) {
                resolve();
            }
            if (document.querySelector(selector)) {
                resolve();
            } else if (timeout && Date.now() - start >= timeout) {
                reject(new Error(`Selector not found: ${selector}`));
            } else {
                setTimeout(wait.bind(this, resolve, reject), 30);
            }
        };
        return new Promise(wait);
    }

    waitForHereticProperty(property) {
        const timeout = 10000;
        const start = Date.now();
        const wait = (resolve, reject) => {
            if (!process.browser) {
                resolve();
            }
            if (window.__heretic && window.__heretic[property]) {
                resolve();
            } else if (timeout && Date.now() - start >= timeout) {
                reject(new Error(`Property not found: ${property}`));
            } else {
                setTimeout(wait.bind(this, resolve, reject), 30);
            }
        };
        return new Promise(wait);
    }

    waitForElementInViewport(id) {
        const timeout = 5000;
        const start = Date.now();
        const el = document.getElementById(id);
        const wait = (resolve, reject) => {
            if (!el) {
                reject(new Error(`Element not found: ${id}`));
            }
            if (!process.browser) {
                resolve();
            }
            if (this.isElementInViewport(el)) {
                resolve();
            } else if (timeout && Date.now() - start >= timeout) {
                reject(new Error(`Element not in viewport: ${id}`));
            } else {
                setTimeout(wait.bind(this, resolve, reject), 30);
            }
        };
        return new Promise(wait);
    }

    waitForStyle(id, property, value) {
        const timeout = 5000;
        const start = Date.now();
        const wait = (resolve, reject) => {
            if (!process.browser) {
                resolve();
            }
            if (
                String(
                    window.getComputedStyle(document.getElementById(id))[
                        property
                    ],
                ) === String(value)
            ) {
                resolve();
            } else if (timeout && Date.now() - start >= timeout) {
                reject(new Error(`Style property timeout: ${id}`));
            } else {
                setTimeout(wait.bind(this, resolve, reject), 30);
            }
        };
        return new Promise(wait);
    }

    waitForViewSettled() {
        const timeout = 5000;
        const start = Date.now();
        const wait = (resolve, reject) => {
            if (!process.browser) {
                resolve();
            }
            if (window.__heretic && window.__heretic.viewSettled) {
                resolve();
            } else if (timeout && Date.now() - start >= timeout) {
                reject(new Error("View is not settled"));
            } else {
                setTimeout(wait.bind(this, resolve, reject), 30);
            }
        };
        return new Promise(wait);
    }

    async loadLanguageData(page) {
        if (
            process.browser &&
            window.__heretic &&
            window.__heretic.languageData
        ) {
            // && !window.__heretic.translationsLoaded[page]
            const i18nLoader = require(`#build/loaders/i18n-loader-${page}`);
            window.__heretic.translationsLoaded[page] = true;
            const languageFile = await i18nLoader.loadLanguageFile(this.language);
            const languageData = {
                ...window.__heretic.languageData,
                ...languageFile,
            };
            Object.keys(languageData).map(
                (i) =>
                    (languageData[i] =
                        typeof languageData[i] === "string"
                            ? template(languageData[i])
                            : languageData[i]),
            );
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
            data.url =
                data.url.length > 1 ? data.url.replace(/\/$/, "") : data.url;
        } else {
            data.url = "";
            [data.language] = languages;
        }
        data.parts = urlParts;
        data.base = `${urlParts[0]}//${urlParts[2]}`;
        data.dir =
            urlParts.length > 3
                ? urlParts.filter((_, i) => i > 2).join("/")
                : "";
        return data;
    }

    getLocalizedURL(url) {
        const nonLocalizedURL = this.getNonLocalizedURL(url);
        const resultURL =
            this.language === Object.keys(languagesList)[0]
                ? nonLocalizedURL.url
                : `/${this.language}${nonLocalizedURL.url}`;
        return resultURL.endsWith("/") && resultURL.length > 1
            ? resultURL.slice(0, -1)
            : resultURL;
    }

    getLocalizedFullURL(url) {
        const nonLocalizedURL = this.getNonLocalizedURL(url);
        const resultURL =
            this.language === Object.keys(languagesList)[0]
                ? nonLocalizedURL.url
                : `${nonLocalizedURL.base}/${this.language}/${nonLocalizedURL.dir}`;
        return resultURL.endsWith("/") && resultURL.length > 1
            ? resultURL.slice(0, -1)
            : resultURL;
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
                            (window.innerHeight / 2) - (features.height / 2),
                        );
                        str += `top=${v},`;
                    } else if (key === "left") {
                        const v = Math.round(
                            (window.innerWidth / 2) - (features.width / 2),
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

    isElementInViewport(el) {
        if (el.checkVisibility) {
            return el.checkVisibility();
        }
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <=
                (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <=
                (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    setDarkTheme(isDark) {
        document.documentElement.style.overflow = "hidden";
        document.documentElement.setAttribute(
            "data-color-scheme",
            isDark ? "dark" : "light",
        );
        document.documentElement.style.overflow = "";
    }
}
