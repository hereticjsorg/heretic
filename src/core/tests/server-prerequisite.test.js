import { jest, test, expect } from "@jest/globals";
import fs from "fs-extra";
import path from "path";
import Helpers from "#lib/testHelpers";

jest.setTimeout(120000);
const routeId = "test3wEGNDiB";
const helpers = new Helpers();

test("Create site backup", () => {
    const publicPath = path.resolve(
        __dirname,
        "../../../dist.backup/public/heretic",
    );
    const serverPath = path.resolve(
        __dirname,
        "../../../dist.backup/server.js",
    );
    try {
        fs.ensureDirSync(
            path.resolve(__dirname, "../../../dist.backup/public/heretic"),
        );
        fs.copySync(
            path.resolve(__dirname, "../../../dist/public/heretic"),
            publicPath,
        );
        fs.copySync(
            path.resolve(__dirname, "../../../dist/server.js"),
            serverPath,
        );
        expect(fs.existsSync(publicPath)).toBe(true);
        expect(fs.existsSync(serverPath)).toBe(true);
    } catch {
        // Ignore
    }
});

test("Create test page", async () => {
    if (await helpers.fileExists(`site/modules/${routeId}`)) {
        await helpers.removeFile(`site/modules/${routeId}`);
    }
    await helpers.copy(
        "src/core/defaults/modules/test",
        `site/modules/${routeId}`,
    );
    const testMeta = await helpers.readJSON(
        `site/modules/${routeId}/page/meta.src.json`,
    );
    testMeta.id = routeId;
    for (const language of helpers.getLanguagesList()) {
        testMeta.title[language] = `site-title-${language}`;
        testMeta.description[language] = `site-description-${language}`;
        await helpers.ensureDir(
            `site/modules/${routeId}/page/content/lang-${language}`,
        );
        await helpers.writeFile(
            `site/modules/${routeId}/page/content/lang-${language}/index.marko`,
            `<div>site-content-${language}</div>\n`,
        );
    }
    await helpers.writeJSON(
        `site/modules/${routeId}/page/meta.src.json`,
        testMeta,
    );
});
