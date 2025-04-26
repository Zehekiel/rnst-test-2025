import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts}"], plugins: { js }, extends: ["js/recommended"] },
  { files: ["**/*.{js,mjs,cjs,ts}"], languageOptions: { globals: {...globals.browser, ...globals.node} } },
  tseslint.configs.recommended,
  {
    rules: {
      "no-unused-vars": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "no-console": "warn",
      "no-duplicate-imports": "error",
      "no-multi-spaces": "error",
      "no-multiple-empty-lines": ["error", { max: 2 }],
      "no-trailing-spaces": "error",
      "no-duplicate-case": "error",
      "object-curly-spacing": ["error", "always"],
      "no-unused-expressions": "warn",
      "indent": ["error", 4],
      "eqeqeq": 'error',
      "no-debugger": "error",
      'quotes': 'off',
      '@typescript-eslint/quotes': ['error', 'double'],
      "semi": ["error", "always"],
    },
  },
  eslintConfigPrettier
])