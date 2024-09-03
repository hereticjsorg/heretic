import { jest, test, expect, afterAll } from "@jest/globals";
import os from "os";
import axios from "axios";
import axiosRetry from "axios-retry";
import Helpers from "#lib/testHelpers";
import systemConfig from "#etc/system.js";

axiosRetry(axios, {
    retryDelay: axiosRetry.exponentialDelay,
    retries: 10,
});

const routeId = "test3wEGNDiB";
jest.setTimeout(120000);
const helpers = new Helpers();
let serverPid = [];

test("Server availability (200)", async () => {
    if (!(await helpers.doesServerFileExists())) {
        const { buildSuccess } = await helpers.build("dev");
        expect(buildSuccess).toBe(true);
    }
    const childProcess = helpers.runCommand(
        `npm${os.platform() === "win32" ? ".cmd" : ""} run server`,
    );
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
    serverPid = serverPid.filter((i) => i !== childProcess.pid);
});

test("Server availability (404)", async () => {
    if (!(await helpers.doesServerFileExists())) {
        const { buildSuccess } = await helpers.build("dev");
        expect(buildSuccess).toBe(true);
    }
    const childProcess = helpers.runCommand(
        `npm${os.platform() === "win32" ? ".cmd" : ""} run server`,
    );
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
    }
    helpers.killProcess(childProcess.pid);
    serverPid = serverPid.filter((i) => i !== childProcess.pid);
});

test("Test Page", async () => {
    const childProcess = helpers.runCommand(
        `npm${os.platform() === "win32" ? ".cmd" : ""} run server`,
    );
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
        } catch (e) {
            // Ignore
        }
        expect(response ? response.status : 0).toBe(200);
        expect(response.data).toMatch(`site-title-${language}`);
        expect(response.data).toMatch(`site-description-${language}`);
        expect(response.data).toMatch(`site-content-${language}`);
    }
    helpers.killProcess(childProcess.pid);
    serverPid = serverPid.filter((i) => i !== childProcess.pid);
});

afterAll(async () => {
    for (const pid of serverPid) {
        try {
            helpers.killProcess(pid);
        } catch {
            // Ignore
        }
    }
    if (await helpers.fileExists(`site/modules/${routeId}`)) {
        await helpers.removeFile(`site/modules/${routeId}`);
    }
});
