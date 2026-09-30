/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ["../../packages/config/eslint/base.js"],
  // ios/ 는 Capacitor 가 만드는 네이티브 생성물이라 린트 대상이 아니다.
  ignorePatterns: [".eslintrc.cjs", "ios"],
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
};
