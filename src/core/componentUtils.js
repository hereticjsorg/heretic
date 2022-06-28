export default class {
    constructor(component) {
        this.component = component;
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
                reject(new Error("Component not found"));
            } else {
                setTimeout(wait.bind(this, resolve, reject), 30);
            }
        };
        return new Promise(wait);
    }
}
