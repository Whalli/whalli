/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["./eslint-base.js"],
  env: {
    node: true,
  },
  rules: {
    "@typescript-eslint/no-var-requires": "off",
  },
};