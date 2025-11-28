/**
 * Root ESLint configuration for Axon Flow monorepo
 * Each workspace extends from tooling/eslint/*.js configs
 * @package axon-flow
 */

import baseConfig from "./tooling/eslint/base.js";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...baseConfig,
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/coverage/**",
      "**/.turbo/**",
      "**/pnpm-lock.yaml",
    ],
  },
];
