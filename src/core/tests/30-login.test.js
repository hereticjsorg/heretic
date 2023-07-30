import {
    jest,
    test,
    expect,
    afterAll,
} from "@jest/globals";
import os from "os";
import crypto from "crypto";
import axios from "axios";
import axiosRetry from "axios-retry";
import Helpers from "#lib/testHelpers";
import Auth from "#lib/auth";
import systemConfig from "#etc/system.js";
import websiteConfig from "#etc/website";

axiosRetry(axios, {
    retryDelay: axiosRetry.exponentialDelay,
    retries: 10,
});

jest.setTimeout(120000);
const helpers = new Helpers();
let serverPid = [];

test("Login", async () => {
    if (!systemConfig.mongo.enabled) {
        return;
    }
    if (!(await helpers.doesServerFileExists())) {
        const {
            buildSuccess
        } = await helpers.build("dev");
        expect(buildSuccess).toBe(true);
    }
    const childProcess = helpers.runCommand(`npm${os.platform() === "win32" ? ".cmd" : ""} run server`);
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
    expect(response ? response.status : 0).toBe(200);
    await helpers.connectDatabase();
    const auth = new Auth();
    const username = crypto.randomBytes(20).toString("hex");
    const password = await auth.createHash(`password${systemConfig.secret}`);
    await helpers.db.collection(systemConfig.collections.users).insertOne({
        username,
        password,
        groups: ["admin"],
        test: true,
        active: true
    });
    await helpers.initBrowser();
    const browser = helpers.getBrowser();
    const authPage = await browser.newPage();
    await authPage.goto(`${websiteConfig.url}${systemConfig.routes.signIn}?r=/_status`);
    await authPage.waitForSelector("#hr_hf_el_signInForm_username", {
        visible: true,
        timeout: 15000
    });
    await authPage.type("#hr_hf_el_signInForm_username", username);
    await authPage.type("#hr_hf_el_signInForm_password", "password");
    await authPage.click("#hr_hf_el_signInForm_buttons_btnSubmit");
    await authPage.waitForSelector("#heretic_status", {
        visible: true,
        timeout: 15000
    });
    helpers.killProcess(childProcess);
    serverPid = serverPid.filter(i => i !== childProcess.pid);
});

afterAll(async () => {
    for (const pid of serverPid) {
        try {
            helpers.killProcess(null, pid);
        } catch {
            // Ignore
        }
    }
    if (systemConfig.mongo.enabled) {
        if (helpers.db) {
            await helpers.db.collection(systemConfig.collections.users).deleteMany({
                test: true,
            });
        }
        helpers.disconnectDatabase();
    }
    await helpers.closeBrowser();
});
