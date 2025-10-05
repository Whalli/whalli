module.exports = {
  root: true,
  extends: ["../../packages/config/eslint-base.js"],
  parserOptions: {
    project: "tsconfig.json",
    tsconfigRootDir: __dirname,
    sourceType: "module",
  },
  rules: {
    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "warn", // Downgrade to warning
    "@typescript-eslint/no-var-requires": "warn", // Downgrade to warning
  },
};