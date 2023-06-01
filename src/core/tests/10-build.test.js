import {
    jest,
    test,
    expect,
} from "@jest/globals";
import Helpers from "#lib/testHelpers";

const helpers = new Helpers();
jest.setTimeout(500000);

for (const mode of ["Dev", "Production"]) {
    test(`Build Test: ${mode} Mode`, async () => {
        const {
            serverFileExists,
            publicDirExists,
            buildSuccess
        } = await helpers.build(mode.toLowerCase());
        expect(serverFileExists).toBe(true);
        expect(publicDirExists).toBe(true);
        expect(buildSuccess).toBe(true);
    });
}
