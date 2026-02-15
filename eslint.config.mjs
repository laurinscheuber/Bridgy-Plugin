import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {files: ["**/*.{js,mjs,cjs,ts}"]},
  {languageOptions: { globals: { ...globals.browser, ...globals.node } }},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-case-declarations": "off",
      "no-useless-escape": "off",
      "no-undef": "off", // TypeScript handles this better
      "no-control-regex": "off",
      "no-redeclare": "off", // Allow redeclarations in legacy JS
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "no-prototype-builtins": "off",
      "no-dupe-else-if": "off",
      "no-dupe-keys": "off",
      "no-async-promise-executor": "off",
      "@typescript-eslint/no-unused-expressions": "off"
    }
  },
  {
    files: ["tests/**/*.{ts,js}", "**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-console": "off"
    }
  },
  {
    ignores: ["dist/**", "code.js", "ui.html", "scripts/**", "build.js"]
  }
];
