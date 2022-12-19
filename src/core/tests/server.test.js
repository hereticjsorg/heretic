import {
    jest,
    test,
    expect,
    afterAll,
} from "@jest/globals";
import axios from "axios";
import axiosRetry from "axios-retry";
import Helpers from "../lib/testHelpers";
import systemConfig from "../../../etc/system.js";

axiosRetry(axios, {
    retryDelay: axiosRetry.exponentialDelay,
});

const routeId = "test3wEGNDiB";
jest.setTimeout(120000);
const helpers = new Helpers();
let serverPid = [];

test("Server availability (200)", async () => {
    if (!(await helpers.doesServerFileExists())) {
        const {
            buildSuccess
        } = await helpers.build("dev");
        expect(buildSuccess).toBe(true);
    }
    const childProcess = helpers.runCommand("npm run server");
    expect(childProcess.pid).toBeGreaterThan(0);
    serverPid.push(childProcess.pid);
    let response;
    try {
        response = await axios({
            method: "get",
            url: `http://${systemConfig.server.ip}:${systemConfig.server.port}/_status`,
            timeout: 30000,
        });
    } catch {
        // Ignore
    }
    helpers.killProcess(childProcess.pid);
    expect(response ? response.status : 0).toBe(200);
    serverPid = serverPid.filter(i => i !== childProcess.pid);
});

test("Server availability (404)", async () => {
    if (!(await helpers.doesServerFileExists())) {
        const {
            buildSuccess
        } = await helpers.build("dev");
        expect(buildSuccess).toBe(true);
    }
    const childProcess = helpers.runCommand("npm run server");
    expect(childProcess.pid).toBeGreaterThan(0);
    serverPid.push(childProcess.pid);
    try {
        await axios({
            method: "get",
            url: `http://${systemConfig.server.ip}:${systemConfig.server.port}/zsBEB4Aj67RmaPskCDHNgh6PMQ4AgJ4`,
            timeout: 30000,
        });
    } catch (e) {
        expect(e && e.response ? e.response.status : 0).toBe(404);
        // Ignore
    }
    helpers.killProcess(childProcess.pid);
    serverPid = serverPid.filter(i => i !== childProcess.pid);
});

test("Test Page", async () => {
    if (await helpers.fileExists(`src/pages/${routeId}`)) {
        await helpers.removeFile(`src/pages/${routeId}`);
    }
    await helpers.copy("src/core/defaults/.test", `src/pages/${routeId}`);
    const testMeta = await helpers.readJSON(`src/pages/${routeId}/meta.json`);
    testMeta.id = routeId;
    for (const language of helpers.getLanguagesList()) {
        testMeta.userspace.title[language] = `site-title-${language}`;
        testMeta.userspace.description[language] = `site-description-${language}`;
        await helpers.ensureDir(`src/pages/${routeId}/userspace/content/lang-${language}`);
        await helpers.writeFile(`src/pages/${routeId}/userspace/content/lang-${language}/index.marko`, `<div>site-content-${language}</div>\n`);
    }
    await helpers.writeJSON(`src/pages/${routeId}/meta.json`, testMeta);
    const {
        buildSuccess
    } = await helpers.build("dev");
    expect(buildSuccess).toBe(true);
    await helpers.removeFile(`src/pages/${routeId}`);
    const childProcess = helpers.runCommand("npm run server");
    expect(childProcess.pid).toBeGreaterThan(0);
    serverPid.push(childProcess.pid);
    for (const language of helpers.getLanguagesList()) {
        let response;
        try {
            response = await axios({
                method: "get",
                url: `http://${systemConfig.server.ip}:${systemConfig.server.port}/${language === helpers.getLanguagesList()[0] ? "" : `${language}/`}${routeId}`,
                timeout: 30000,
            });
        } catch {
            // Ignore
        }
        expect(response ? response.status : 0).toBe(200);
        expect(response.data).toMatch(`site-title-${language}`);
        expect(response.data).toMatch(`site-description-${language}`);
        expect(response.data).toMatch(`site-content-${language}`);
    }
    helpers.killProcess(childProcess.pid);
    serverPid = serverPid.filter(i => i !== childProcess.pid);
});

afterAll(async () => {
    for (const pid of serverPid) {
        try {
            helpers.killProcess(pid);
        } catch {
            // Ignore
        }
    }
    if (await helpers.fileExists(`src/pages/${routeId}`)) {
        await helpers.removeFile(`src/pages/${routeId}`);
    }
});
