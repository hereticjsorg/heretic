const esModules = [
    "uuid",
    "@babel/runtime",
    "@babel",
    "strip-final-newline",
    "npm-run-path",
    "path-key",
    "onetime",
    "mimic-fn",
    "human-signals",
    "is-stream",
    "taskkill",
    "arrify",
    "aggregate-error",
    "indent-string",
    "clean-stack",
    "escape-string-regexp",
    "pid-port"
].join("|");

module.exports = {
    verbose: true,
    displayName: "heretic",
    testRegex: "[^.]+\\.test\\.js$",
    testEnvironment: "node",
    transformIgnorePatterns: [
        `node_modules/(?!(${esModules}))`,
    ],
    transform: {
        "^.+\\.jsx?$": "<rootDir>/node_modules/babel-jest",
    },
    testSequencer: "./src/core/tests/sequencer.js",
    maxWorkers: 1,
};
