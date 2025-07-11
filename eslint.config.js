const {
    defineConfig,
    globalIgnores,
} = require("eslint/config");

const babelParser = require("@babel/eslint-parser");
const globals = require("globals");

module.exports = defineConfig([
    {
        languageOptions: {
            parser: babelParser,
            ecmaVersion: 2018,
            sourceType: "module",

            parserOptions: {
                ecmaFeatures: {
                    jsx: false,
                },
            },

            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },

        rules: {
            "no-dupe-keys": "error",
            quotes: ["error", "double", { allowTemplateLiterals: true }],
            "template-curly-spacing": "off",
            indent: "off",
            "prefer-const": "warn",
            "camelcase": "warn",
            "no-irregular-whitespace": "warn",
            "no-use-before-define": "warn",
            "prefer-destructuring": "off",
            "no-eval": "warn",
            "no-multi-assign": "warn",
            "prefer-spread": "warn",
            "no-restricted-globals": "warn",
            "no-redeclare": "warn",
            "block-scoped-var": "warn",
            "vars-on-top": "warn",
            "no-var": "warn",
            "no-shadow": "warn",
            "no-bitwise": "warn",
            "generator-star-spacing": "warn",
            "no-control-regex": "warn",
            "no-mixed-operators": "warn",
            "no-plusplus": "warn",
            "object-shorthand": "warn",
            "no-unused-vars": "error",
            "no-undef": "warn",
            "max-classes-per-file": "warn",
            "default-param-last": "warn",
            "no-loop-func": "warn",
            "no-void": "warn",
            "no-unreachable": "error",
            "func-names": "warn",
            "no-console": "warn",
            "arrow-parens": "off",
            "comma-dangle": "off",
            "array-callback-return": "off",
            "guard-for-in": "off",
            "import/extensions": "off",
            "max-len": "off",
            "no-confusing-arrow": "off",
            "no-unused-expressions": "off",
            "no-nested-ternary": "off",
            "no-return-assign": "off",
            "no-underscore-dangle": "off",
            "linebreak-style": "off",
            "import/no-dynamic-require": "off",
            "no-case-declarations": "off",
            "global-require": "off",
            "no-async-promise-executor": "off",
            "dot-notation": "off",
            "no-param-reassign": "off",
            "import/no-extraneous-dependencies": "off",
            "default-case": "off",
            "class-methods-use-this": "off",
            "no-cond-assign": "off",
            "no-new": "off",
            "consistent-return": "off",
            "no-await-in-loop": "off",
            "no-continue": "off",
            "space-in-parens": "off",
            "no-trailing-spaces": "off",
            "eol-last": "off",
            "operator-linebreak": "off",
            "implicit-arrow-linebreak": "off",
            "comma-style": "off",
            "object-curly-newline": "off",
            "function-paren-newline": "off",
            "no-useless-escape": "warn",
        },
    },
    globalIgnores(["src/core/defaults"]),
]);
