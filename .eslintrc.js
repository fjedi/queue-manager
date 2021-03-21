module.exports = {
  plugins: ['@typescript-eslint', 'prettier', 'import'],
  extends: [
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'prettier',
  ],
  env: {
    es6: true,
    browser: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: 'module',
    jsx: true,
    project: 'tsconfig-cjs.json',
  },
  rules: {
    'no-debugger': 'off',
    'no-console': 1,
    // note you must disable the base rule as it can report incorrect errors
    'lines-between-class-members': 'off',
    '@typescript-eslint/lines-between-class-members': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
  },
};
