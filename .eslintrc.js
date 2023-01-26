module.exports = {
    root: true,
    env: {
        es6: true,
        node: true,
    },
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    parserOptions: {
        sourceType: "module",
        project: "tsconfig.eslint.json",
        tsconfigRootDir: __dirname,
    },
    ignorePatterns: ["dist"],
    extends: [
        "airbnb-base",
        "airbnb-typescript/base",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "prettier",
    ],
    rules: {
        "import/prefer-default-export": "off",
        "no-console": "off",
        "@typescript-eslint/no-floating-promises": [
            "error",
            {
                ignoreIIFE: true,
            },
        ],
        "@typescript-eslint/no-non-null-assertion": ["error"],
    },
};
