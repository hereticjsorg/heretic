import {
    jest,
    test,
    expect,
    afterAll,
} from "@jest/globals";
import axios from "axios";
import retryAxios from "retry-axios";
import {
    execa
} from "execa";
import crypto from "crypto";
import fkill from "fkill";
import Helpers from "../core/testHelpers";
import systemConfig from "../../etc/system.json";

const routeId = "test3wEGNDiB";
jest.setTimeout(120000);
const helpers = new Helpers();
const raxConfig = {
    retry: 20,
    noResponseRetries: 20,
    retryDelay: 100,
    statusCodesToRetry: [
        [100, 199],
        [400, 403],
    ],
};
retryAxios.attach();
let serverPid = [];

test("Server availability (200)", async () => {
    if (!(await helpers.doesServerFileExists())) {
        const {
            buildSuccess
        } = await helpers.build("dev");
        expect(buildSuccess).toBe(true);
    }
    const childProcess = execa("npm run server");
    expect(childProcess.pid).toBeGreaterThan(0);
    serverPid.push(childProcess.pid);
    let response;
    try {
        response = await axios({
            method: "get",
            url: `http://${systemConfig.server.ip}:${systemConfig.server.port}`,
            timeout: 30000,
            raxConfig,
        });
    } catch {
        // Ignore
    }
    await fkill(childProcess.pid, {
        force: true
    });
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
    const childProcess = execa("npm run server");
    expect(childProcess.pid).toBeGreaterThan(0);
    serverPid.push(childProcess.pid);
    try {
        await axios({
            method: "get",
            url: `http://${systemConfig.server.ip}:${systemConfig.server.port}/zsBEB4Aj67RmaPskCDHNgh6PMQ4AgJ4`,
            timeout: 30000,
            raxConfig,
        });
    } catch (e) {
        expect(e && e.response ? e.response.status : 0).toBe(404);
        // Ignore
    }
    await fkill(childProcess.pid, {
        force: true
    });
    serverPid = serverPid.filter(i => i !== childProcess.pid);
});

test("Test Page", async () => {
    const id = crypto.randomBytes(20).toString("hex");
    if (await helpers.fileExists(`src/pages/${routeId}`)) {
        await helpers.removeFile(`src/pages/${routeId}`);
    }
    await helpers.copy("src/core/defaults/.test", `src/pages/${routeId}`);
    const testMeta = await helpers.readJSON(`src/pages/${routeId}/page.json`);
    testMeta.id = routeId;
    testMeta.path = `/${id}`;
    for (const language of helpers.getLanguagesList()) {
        testMeta.title[language] = `site-title-${language}`;
        testMeta.description[language] = `site-description-${language}`;
        await helpers.ensureDir(`src/pages/${routeId}/content/lang-${language}`);
        await helpers.writeFile(`src/pages/${routeId}/content/lang-${language}/index.marko`, `<div>site-content-${language}</div>\n`);
    }
    await helpers.writeJSON(`src/pages/${routeId}/page.json`, testMeta);
    const {
        buildSuccess
    } = await helpers.build("dev");
    expect(buildSuccess).toBe(true);
    await helpers.removeFile(`src/pages/${routeId}`);
    const childProcess = execa("npm run server");
    expect(childProcess.pid).toBeGreaterThan(0);
    serverPid.push(childProcess.pid);
    for (const language of helpers.getLanguagesList()) {
        let response;
        try {
            response = await axios({
                method: "get",
                url: `http://${systemConfig.server.ip}:${systemConfig.server.port}/${language === helpers.getLanguagesList()[0] ? "" : `${language}/`}${id}`,
                timeout: 30000,
                raxConfig,
            });
        } catch {
            // Ignore
        }
        expect(response ? response.status : 0).toBe(200);
        expect(response.data).toMatch(`site-title-${language}`);
        expect(response.data).toMatch(`site-description-${language}`);
        expect(response.data).toMatch(`site-content-${language}`);
    }
    await fkill(childProcess.pid, {
        force: true
    });
    serverPid = serverPid.filter(i => i !== childProcess.pid);
});

afterAll(async () => {
    for (const pid of serverPid) {
        try {
            await fkill(pid, {
                force: true
            });
        } catch {
            // Ignore
        }
    }
    if (await helpers.fileExists(`src/pages/${routeId}`)) {
        await helpers.removeFile(`src/pages/${routeId}`);
    }
});
