/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ["../packages/config/eslint/base.js"],
  ignorePatterns: [".eslintrc.cjs", ".artifacts"],
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
};
