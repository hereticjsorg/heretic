import {
    jest,
    test,
    expect,
} from "@jest/globals";
import axios from "axios";
import retryAxios from "retry-axios";
import {
    execa
} from "execa";
import fkill from "fkill";
import Helpers from "./helpers";

jest.setTimeout(120000);
const helpers = new Helpers();
const raxConfig = {
    retry: 20,
    noResponseRetries: 20,
    retryDelay: 100,
    statusCodesToRetry: [
        [100, 199],
        [400, 404],
    ],
};
retryAxios.attach();

test("Server availability", async () => {
    if (!(await helpers.doesServerFileExists()) || !(await helpers.doesPublicDirExists())) {
        const {
            buildSuccess
        } = await helpers.build("dev");
        expect(buildSuccess).toBe(true);
    }
    const childProcess = execa("npm run server");
    expect(childProcess.pid).toBeGreaterThan(0);
    let response;
    try {
        response = await axios({
            method: "get",
            url: "http://127.0.0.1:3001",
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
});
