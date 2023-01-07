import {
    jest,
    test,
    expect,
} from "@jest/globals";
import fs from "fs-extra";
import path from "path";
import Helpers from "../lib/testHelpers";

jest.setTimeout(120000);
const routeId = "test3wEGNDiB";
const helpers = new Helpers();

test("Create site backup", () => {
    const publicPath = path.resolve(__dirname, "../../../dist.backup/public/heretic");
    const serverPath = path.resolve(__dirname, "../../../dist.backup/server.js");
    fs.ensureDirSync(path.resolve(__dirname, "../../../dist.backup/public/heretic"));
    fs.copySync(path.resolve(__dirname, "../../../dist/public/heretic"), publicPath);
    fs.copySync(path.resolve(__dirname, "../../../dist/server.js"), serverPath);
    expect(fs.existsSync(publicPath)).toBe(true);
    expect(fs.existsSync(serverPath)).toBe(true);
});

test("Create test page", async () => {
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
});
