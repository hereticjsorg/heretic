module.exports = {
    verbose: true,
    displayName: "heretic",
    testRegex: "src/core/tests/[^.]+\\.test\\.js$",
    testEnvironment: "node",
    transformIgnorePatterns: [
        "node_modules/(?!@babel|strip-final-newline|npm-run-path|path-key|onetime|mimic-fn|human-signals|is-stream|taskkill|arrify|aggregate-error|indent-string|clean-stack|escape-string-regexp|pid-port)"
    ],
    transform: {
        "^.+\\.js$": "<rootDir>/node_modules/babel-jest",
    },
    testSequencer: "./src/core/tests/sequencer.js",
    maxWorkers: 1,
};
