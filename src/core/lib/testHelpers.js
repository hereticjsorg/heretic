import path from "path";
import fs from "fs-extra";
import {
    spawn,
} from "node:child_process";
import which from "which";
import {
    MongoClient,
} from "mongodb";
import puppeteer from "puppeteer-core";
import languages from "../../config/languages.json";
import config from "../../../etc/system";

export default class {
    /* istanbul ignore file */
    async removeFile(file) {
        await fs.remove(path.resolve(__dirname, "..", "..", "..", file));
    }

    /* istanbul ignore file */
    async readJSON(file) {
        return fs.readJSON(path.resolve(__dirname, "..", "..", "..", file));
    }

    /* istanbul ignore file */
    async writeJSON(file, data) {
        await fs.writeJSON(path.resolve(__dirname, "..", "..", "..", file), data, {
            spaces: "\t"
        });
    }

    /* istanbul ignore file */
    getLanguagesConfig() {
        return languages;
    }

    /* istanbul ignore file */
    getLanguagesList() {
        return Object.keys(languages);
    }

    /* istanbul ignore file */
    async fileExists(file) {
        try {
            await fs.access(path.resolve(__dirname, "..", "..", "..", file), fs.F_OK);
            return true;
        } catch {
            return false;
        }
    }

    /* istanbul ignore file */
    async copy(src, dest) {
        await fs.copy(path.resolve(__dirname, "..", "..", "..", src), path.resolve(__dirname, "..", "..", "..", dest));
    }

    /* istanbul ignore file */
    async ensureDir(dir) {
        await fs.ensureDir(path.resolve(__dirname, "..", "..", "..", dir));
    }

    /* istanbul ignore file */
    async writeFile(file, data) {
        await fs.writeFile(path.resolve(__dirname, "..", "..", "..", file), data, {
            encoding: "utf8"
        });
    }

    /* istanbul ignore file */
    async doesServerFileExists() {
        return this.fileExists("dist/server.js");
    }

    /* istanbul ignore file */
    async doesPublicDirExists() {
        return this.fileExists("dist/public");
    }

    async executeCommand(command = "") {
        return new Promise((resolve, reject) => {
            const res = {
                stdout: "",
                stderr: "",
                exitCode: 1,
            };
            const commandArr = command.split(/ /);
            if (!commandArr.length) {
                reject(new Error("No command specified"));
            }
            const cmd = commandArr.shift();
            const result = spawn(cmd, commandArr);
            result.stdout.on("data", data => res.stdout += data);
            result.stderr.on("data", data => res.stderr += data);
            result.on("close", code => resolve(({
                ...res,
                exitCode: code,
            })));
        });
    }

    /* istanbul ignore file */
    runCommand(command = "") {
        const commandArr = command.split(/ /);
        if (!commandArr.length) {
            throw new Error("No command specified");
        }
        const cmd = commandArr.shift();
        const execObj = spawn(cmd, commandArr, {
            cwd: path.resolve(__dirname, "../../.."),
            detached: true,
        });
        return execObj;
    }

    /* istanbul ignore file */
    killProcess(pid) {
        process.kill(-pid);
    }

    /* istanbul ignore file */
    async build(suffix) {
        await this.removeFile("dist");
        const data = await this.executeCommand(`npm run build-${suffix} -- --no-color`);
        const serverFileExists = await this.doesServerFileExists();
        const publicDirExists = await this.doesPublicDirExists();
        const buildResultMatch = data && data.exitCode === 0 && typeof data.stdout === "string" ? data.stdout.match(/compiled successfully/gm) : [];
        const buildSuccess = (buildResultMatch && Array.isArray(buildResultMatch) && buildResultMatch.length === 3);
        return {
            serverFileExists,
            publicDirExists,
            buildSuccess
        };
    }

    /* istanbul ignore file */
    getChromePath() {
        if (process.platform === "linux") {
            let bin = null;
            for (const command of ["google-chrome", "google-chrome-stable"]) {
                try {
                    if (which.sync(command)) {
                        bin = command;
                        break;
                    }
                } catch {
                    // Ignore
                }
            }
            return bin;
        }
        if (process.platform === "darwin") {
            const defaultPath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
            const homePath = path.join(process.env.HOME, defaultPath);
            try {
                fs.accessSync(homePath);
                return homePath;
            } catch {
                // Ignore;
            }
            try {
                fs.accessSync(defaultPath);
                return defaultPath;
            } catch {
                // Ignore;
            }
            return null;
        }
        if (process.platform === "win32") {
            const chromeDirName = "Chrome";
            const suffix = `\\Google\\${chromeDirName}\\Application\\chrome.exe`;
            for (const prefix of [process.env.LOCALAPPDATA, process.env.PROGRAMFILES, process.env["PROGRAMFILES(X86)"]]) {
                try {
                    const windowsChromeDirectory = path.join(prefix, suffix);
                    fs.accessSync(windowsChromeDirectory);
                    return windowsChromeDirectory;
                } catch {
                    // Ignore
                }
            }
            return null;
        }
    }

    /* istanbul ignore file */
    async initBrowser() {
        this.browser = await puppeteer.launch({
            ...config.test,
            executablePath: config.test.executablePath === "auto" ? this.getChromePath() : config.test.executablePath,
        });
    }

    getBrowser() {
        return this.browser;
    }

    /* istanbul ignore file */
    async closeBrowser() {
        if (this.browser) {
            try {
                const pages = await this.browser.pages();
                await Promise.all(pages.map(page => page.close()));
            } catch {
                // Ignore
            }
            try {
                if (this.browser && this.browser.process() != null) {
                    this.browser.process().kill("SIGINT");
                }
            } catch {
                // Ignore
            }
        }
    }

    async connectDatabase() {
        if (config.mongo.enabled) {
            this.mongoClient = new MongoClient(config.mongo.url, config.mongo.options || {
                useUnifiedTopology: true,
                connectTimeoutMS: 5000,
                keepAlive: true,
                useNewUrlParser: true
            });
            await this.mongoClient.connect();
            this.db = this.mongoClient.db(config.mongo.dbName);
        }
    }

    disconnectDatabase() {
        if (config.mongo.enabled && this.db) {
            this.mongoClient.close();
        }
    }
}
