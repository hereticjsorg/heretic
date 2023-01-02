const TestSequencer = require("@jest/test-sequencer").default;
const path = require("path");

class HereticTestSequencer extends TestSequencer {
    sort(tests) {
        return tests.sort((testA, testB) => {
            const test1 = path.basename(testA.path);
            const test2 = path.basename(testB.path);
            if (test1.match(/-prerequisite/)) {
                return -1;
            }
            if (test2.match(/-prerequisite/)) {
                return 1;
            }
            if (test1.match(/-cleanup/)) {
                return 1;
            }
            if (test2.match(/-cleanup/)) {
                return -1;
            }
            return test1.localeCompare(test2);
        });
    }
}

module.exports = HereticTestSequencer;
