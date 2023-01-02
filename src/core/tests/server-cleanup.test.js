import {
    jest,
    test,
    expect,
} from "@jest/globals";
import fs from "fs-extra";
import path from "path";
import Helpers from "../lib/testHelpers";

const routeId = "test3wEGNDiB";
const helpers = new Helpers();
jest.setTimeout(120000);

test("Restore site backup", () => {
    const backupPath = path.resolve(__dirname, "../../../dist.backup");
    const publicBackupPath = path.resolve(__dirname, "../../../dist.backup/public/heretic");
    const serverBackupPath = path.resolve(__dirname, "../../../dist.backup/server.js");
    const setupBackupPath = path.resolve(__dirname, "../../../dist.backup/setup.js");
    const publicPath = path.resolve(__dirname, "../../../dist/public/heretic");
    const serverPath = path.resolve(__dirname, "../../../dist/server.js");
    const setupPath = path.resolve(__dirname, "../../../dist/setup.js");
    fs.removeSync(publicPath);
    fs.removeSync(serverPath);
    fs.removeSync(setupPath);
    expect(fs.existsSync(publicPath)).toBe(false);
    expect(fs.existsSync(serverPath)).toBe(false);
    expect(fs.existsSync(setupPath)).toBe(false);
    fs.moveSync(publicBackupPath, publicPath);
    fs.moveSync(serverBackupPath, serverPath);
    fs.moveSync(setupBackupPath, setupPath);
    fs.removeSync(backupPath);
    expect(fs.existsSync(backupPath)).toBe(false);
    expect(fs.existsSync(publicPath)).toBe(true);
    expect(fs.existsSync(serverPath)).toBe(true);
    expect(fs.existsSync(setupPath)).toBe(true);
});

test("Remove test page", async () => {
    await helpers.removeFile(`src/pages/${routeId}`);
});
