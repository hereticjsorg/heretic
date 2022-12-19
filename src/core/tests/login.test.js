import {
    jest,
    test,
    expect,
    afterAll,
} from "@jest/globals";
import axios from "axios";
// import puppeteer from "puppeteer";
import axiosRetry from "axios-retry";
import Helpers from "../lib/testHelpers";
// import systemConfig from "../../../etc/system.js";

axiosRetry(axios, {
    retryDelay: axiosRetry.exponentialDelay,
});

jest.setTimeout(120000);
const helpers = new Helpers();
let serverPid = [];

test("Login", async () => {
    if (!(await helpers.doesServerFileExists())) {
        const {
            buildSuccess
        } = await helpers.build("dev");
        expect(buildSuccess).toBe(true);
    }
    const childProcess = helpers.runCommand("npm run server");
    expect(childProcess.pid).toBeGreaterThan(0);
    serverPid.push(childProcess.pid);
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
});
