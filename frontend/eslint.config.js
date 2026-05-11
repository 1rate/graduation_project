import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  {
    ignores: ["dist", "node_modules", ".vercel", "src/shared/ui/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,

  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-import-type-side-effects": "error",

      "no-console": ["warn", { allow: ["error", "warn"] }],
      "no-debugger": "error",
      "prefer-const": "error",
    },
  },

  {
    files: ["src/**/*.{ts,tsx}"],
    settings: {
      "import/resolver": {
        typescript: true,
      },
    },
    rules: {
      "import/no-restricted-paths": [
        "warn",
        {
          zones: [
            {
              target: "src/features/**",
              from: "src/pages/**",
              message: "❌ features не может импортировать pages. Нарушение слоя FSD.",
            },
            {
              target: "src/shared/**",
              from: "src/features/**",
              message: "❌ shared не может импортировать features.",
            },
            {
              target: "src/shared/**",
              from: "src/pages/**",
              message: "❌ shared не может импортировать pages.",
            },
          ],
        },
      ],

      "import/no-cycle": ["warn", { maxDepth: 3 }],

      "import/order": [
        "warn",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always",
          alphabetize: { order: "asc" },
        },
      ],
    },
  },
);
