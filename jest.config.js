module.exports = {
    verbose: true,
    displayName: "heretic",
    testRegex: "src/tests/[^.]+\\.test\\.js$",
    testEnvironment: "node",
    transformIgnorePatterns: [
        "node_modules/(?!execa|@babel|strip-final-newline|npm-run-path|path-key|onetime|mimic-fn|human-signals|is-stream|fkill|taskkill|arrify|aggregate-error|indent-string|clean-stack|escape-string-regexp|pid-port)"
    ],
    transform: {
        "^.+\\.js$": "<rootDir>/node_modules/babel-jest",
    },
};
