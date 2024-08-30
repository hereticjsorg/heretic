import { jest, test, expect } from "@jest/globals";
import fs from "fs-extra";
import path from "path";
import Helpers from "#lib/testHelpers";

const routeId = "test3wEGNDiB";
const helpers = new Helpers();
jest.setTimeout(120000);

test("Restore site backup", () => {
    const backupPath = path.resolve(__dirname, "../../../dist.backup");
    const publicBackupPath = path.resolve(
        __dirname,
        "../../../dist.backup/public/heretic",
    );
    const serverBackupPath = path.resolve(
        __dirname,
        "../../../dist.backup/server.js",
    );
    const publicPath = path.resolve(__dirname, "../../../dist/public/heretic");
    const serverPath = path.resolve(__dirname, "../../../dist/server.js");
    try {
        fs.removeSync(publicPath);
        fs.removeSync(serverPath);
        expect(fs.existsSync(publicPath)).toBe(false);
        expect(fs.existsSync(serverPath)).toBe(false);
        fs.moveSync(publicBackupPath, publicPath);
        fs.moveSync(serverBackupPath, serverPath);
        fs.removeSync(backupPath);
        expect(fs.existsSync(backupPath)).toBe(false);
        expect(fs.existsSync(publicPath)).toBe(true);
        expect(fs.existsSync(serverPath)).toBe(true);
    } catch {
        // Ignore
    }
});

test("Remove test page", async () => {
    await helpers.removeFile(`site/modules/${routeId}`);
});
