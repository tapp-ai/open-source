import type { ESLint, Linter } from "eslint";
import noUnusedClass from "./rules/no-unused-class.ts";
import noUndefClass from "./rules/no-undef-class.ts";

const rules = {
  "no-unused-class": noUnusedClass,
  "no-undef-class": noUndefClass,
};

const plugin = {
  meta: {
    name: "@conversion-ai/eslint-plugin-css-modules",
    version: "0.0.1-alpha.1",
  },
  rules,
  configs: {} as Record<string, Linter.Config>,
} satisfies ESLint.Plugin;

plugin.configs.recommended = {
  plugins: {
    "css-modules": plugin,
  },
  rules: {
    "css-modules/no-unused-class": "error",
    "css-modules/no-undef-class": "error",
  },
} satisfies Linter.Config;

export default plugin;
