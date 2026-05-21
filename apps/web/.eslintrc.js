/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['../../packages/config/eslint/base.js', 'next/core-web-vitals'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
