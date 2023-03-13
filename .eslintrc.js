module.exports = {
    ignorePatterns: ["src/core/defaults"],
    parser: "@babel/eslint-parser",
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: "module",
        ecmaFeatures: {
            jsx: false
        }
    },
    plugins: [
        "@typescript-eslint"
    ],
    extends: "airbnb-base",
    env: {
        es6: true,
        browser: true,
        node: true,
        es2020: true
    },
    rules: {
        quotes: ["error", "double",
            {
                allowTemplateLiterals: true
            }
        ],
        "template-curly-spacing": "off",
        indent: "off",
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
        "no-restricted-syntax": "off",
        "no-continue": "off"
    },
    overrides: [{
        files: ["**/*.ts", "**/*.tsx"],
        plugins: [
            "@typescript-eslint",
        ],
        extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
        parser: "@typescript-eslint/parser",
        parserOptions: {
            project: [`${__dirname}/tsconfig.json`],
        },
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-var-requires": "off",
        }
    }],
};
