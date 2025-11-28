/**
 * NestJS ESLint configuration
 * Extends base config with NestJS-specific patterns
 * @package tooling/eslint
 */

import baseConfig from "./base.js";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...baseConfig,
  {
    files: ["**/*.ts"],
    rules: {
      // NestJS patterns - allow class-based DI
      "@typescript-eslint/no-extraneous-class": "off",

      // Allow empty functions for lifecycle hooks
      "@typescript-eslint/no-empty-function": [
        "error",
        { allow: ["constructors"] },
      ],

      // Interface naming convention for NestJS
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "interface",
          format: ["PascalCase"],
          custom: {
            regex: "^I[A-Z]",
            match: false,
          },
        },
      ],
    },
  },
];
