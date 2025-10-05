module.exports = {
  root: true,
  extends: ["../../packages/config/eslint-nextjs.js"],
  rules: {
    // Temporarily disable strict accessibility rules
    "jsx-a11y/click-events-have-key-events": "off",
    "jsx-a11y/no-static-element-interactions": "off",
    "jsx-a11y/label-has-associated-control": "off",
    "jsx-a11y/no-autofocus": "off",
    "react/no-unescaped-entities": "off",
    "react-hooks/exhaustive-deps": "warn",
    "@next/next/no-img-element": "warn",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
  },
};